import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class BusinessesService {
  constructor(private readonly db: DatabaseService) {}

  async createBusiness(data: {
    userId: number;
    districtId: number;
    type: string;
  }) {
    const user = await this.db.findOne('users', { id: data.userId });
    if (!user) {
      throw new Error('User not found');
    }

    const creationCost = this.getBusinessCreationCost(data.type);
    if (user.narCoin < creationCost) {
      throw new Error('Not enough NAR coins');
    }

    const existing = await this.db.query(
      'SELECT * FROM businesses WHERE "userId" = $1 AND "districtId" = $2 AND type = $3 LIMIT 1',
      [data.userId, data.districtId, data.type]
    ).then(r => r.rows[0]);

    if (existing) {
      throw new Error('Business already exists');
    }

    const business = await this.db.create('businesses', {
      userId: data.userId,
      districtId: data.districtId,
      type: data.type,
      level: 1,
      incomePerHour: this.getBaseIncomePerHour(data.type),
      productionPerHour: this.getBaseProductionPerHour(data.type),
      storageLimit: this.getBaseStorageLimit(data.type),
      storageCurrent: 0,
      maintenanceCost: this.getBaseMaintenanceCost(data.type),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.db.query(
      'UPDATE users SET "narCoin" = "narCoin" - $1 WHERE id = $2',
      [creationCost, data.userId]
    );

    return business;
  }

  async getUserBusinesses(userId: number) {
    const businesses = await this.db.findMany('businesses', { userId }, { orderBy: '"createdAt" DESC' });

    return await Promise.all(
      businesses.map(async (business) => {
        const district = await this.db.findOne('districts', { id: business.districtId });
        return {
          ...business,
          district: district || null,
        };
      })
    );
  }

  async getDistrictBusinesses(districtId: number) {
    const businesses = await this.db.query(
      `SELECT b.*, u.id as "userId", u.nickname, u."firstName"
       FROM businesses b
       JOIN users u ON b."userId" = u.id
       WHERE b."districtId" = $1
       ORDER BY b.level DESC`,
      [districtId]
    );

    return businesses.rows.map(b => ({
      ...b,
      user: {
        id: b.userId,
        nickname: b.nickname,
        firstName: b.firstName,
      },
    }));
  }

  async collectIncome(userId: number, businessId: number) {
    const business = await this.db.findOne('businesses', { id: businessId });

    if (!business || business.userId !== userId) {
      throw new Error('Business not found or access denied');
    }

    const now = new Date();
    const lastCollected = business.lastCollected || business.createdAt;
    const hoursPassed = (now.getTime() - new Date(lastCollected).getTime()) / (1000 * 60 * 60);
    const income = Math.floor(hoursPassed * business.incomePerHour);
    const maxIncome = business.incomePerHour * 24;
    const finalIncome = Math.min(income, maxIncome);

    await this.db.transaction(async (client) => {
      await client.query(
        'UPDATE businesses SET "lastCollected" = $1 WHERE id = $2',
        [now, businessId]
      );
      await client.query(
        'UPDATE users SET "narCoin" = "narCoin" + $1 WHERE id = $2',
        [finalIncome, userId]
      );
    });

    return { income: finalIncome, collectedAt: now };
  }

  async upgradeBusiness(userId: number, businessId: number) {
    const business = await this.db.findOne('businesses', { id: businessId });

    if (!business || business.userId !== userId) {
      throw new Error('Business not found or access denied');
    }

    const upgradeCost = this.getUpgradeCost(business.type, business.level);
    const user = await this.db.findOne('users', { id: userId });

    if (!user || user.narCoin < upgradeCost) {
      throw new Error('Not enough NAR coins');
    }

    const incomeIncrease = this.getIncomeIncrease(business.type);
    const productionIncrease = business.productionPerHour ? this.getProductionIncrease(business.type) : 0;
    const storageIncrease = business.storageLimit ? this.getStorageIncrease(business.type) : 0;
    const maintenanceIncrease = this.getMaintenanceIncrease(business.type);

    await this.db.transaction(async (client) => {
      await client.query(
        `UPDATE businesses SET 
          level = level + 1,
          "incomePerHour" = "incomePerHour" + $1,
          "productionPerHour" = CASE WHEN "productionPerHour" IS NOT NULL THEN "productionPerHour" + $2 ELSE NULL END,
          "storageLimit" = CASE WHEN "storageLimit" IS NOT NULL THEN "storageLimit" + $3 ELSE NULL END,
          "maintenanceCost" = "maintenanceCost" + $4,
          "updatedAt" = $5
         WHERE id = $6`,
        [incomeIncrease, productionIncrease, storageIncrease, maintenanceIncrease, new Date(), businessId]
      );
      await client.query(
        'UPDATE users SET "narCoin" = "narCoin" - $1 WHERE id = $2',
        [upgradeCost, userId]
      );
    });

    return await this.db.findOne('businesses', { id: businessId });
  }

  async produceResources(userId: number, businessId: number) {
    const business = await this.db.findOne('businesses', { id: businessId });

    if (!business || business.userId !== userId || !business.productionPerHour) {
      throw new Error('Business not found or not a production business');
    }

    const now = new Date();
    const lastProduced = business.lastProduced || business.createdAt;
    const hoursPassed = (now.getTime() - new Date(lastProduced).getTime()) / (1000 * 60 * 60);
    const produced = Math.floor(hoursPassed * business.productionPerHour);

    if (produced === 0) {
      return { produced: 0, message: 'No resources produced yet' };
    }

    const availableSpace = (business.storageLimit || 0) - business.storageCurrent;
    const finalProduced = Math.min(produced, availableSpace);

    if (finalProduced === 0) {
      return { produced: 0, message: 'Storage is full' };
    }

    await this.db.query(
      'UPDATE businesses SET "storageCurrent" = "storageCurrent" + $1, "lastProduced" = $2 WHERE id = $3',
      [finalProduced, now, businessId]
    );

    const updated = await this.db.findOne('businesses', { id: businessId });
    return { produced: finalProduced, storageCurrent: updated.storageCurrent };
  }

  async collectResources(userId: number, businessId: number, amount: number) {
    const business = await this.db.findOne('businesses', { id: businessId });

    if (!business || business.userId !== userId) {
      throw new Error('Business not found or access denied');
    }

    if (business.storageCurrent < amount) {
      throw new Error('Not enough resources in storage');
    }

    const resourceType = this.getResourceTypeForBusiness(business.type);

    await this.db.transaction(async (client) => {
      await client.query(
        'UPDATE businesses SET "storageCurrent" = "storageCurrent" - $1 WHERE id = $2',
        [amount, businessId]
      );
      await this.addResourceToUser(userId, resourceType, amount, client);
    });

    return { collected: amount, resourceType };
  }

  private async addResourceToUser(userId: number, resourceType: string, amount: number, client?: any) {
    const queryFn = client ? client.query.bind(client) : this.db.query.bind(this.db);
    
    const existing = await queryFn(
      'SELECT * FROM resources WHERE "userId" = $1 AND type = $2 LIMIT 1',
      [userId, resourceType]
    ).then((r: any) => r.rows[0]);

    if (existing) {
      await queryFn(
        'UPDATE resources SET amount = amount + $1, "updatedAt" = $2 WHERE "userId" = $3 AND type = $4',
        [amount, new Date(), userId, resourceType]
      );
    } else {
      await queryFn(
        'INSERT INTO resources ("userId", type, amount, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5)',
        [userId, resourceType, amount, new Date(), new Date()]
      );
    }
  }

  async craftSkin(userId: number, businessId: number, skinId: number) {
    const business = await this.db.findOne('businesses', { id: businessId });
    if (!business || business.userId !== userId) {
      throw new Error('Business not found or access denied');
    }

    const skin = await this.db.findOne('skins', { id: skinId });
    if (!skin || !skin.isActive) {
      throw new Error('Skin not found or not available');
    }

    const recipe = this.getCraftRecipe(business.type, skin.type);
    if (!recipe) {
      throw new Error('This business cannot craft this type of skin');
    }

    const userResources = await this.db.findMany('resources', { userId });
    const resourceMap = new Map(userResources.map((r) => [r.type, r.amount]));

    for (const [resourceType, requiredAmount] of Object.entries(recipe.resources)) {
      const available = resourceMap.get(resourceType) || 0;
      if (available < requiredAmount) {
        throw new Error(`Not enough ${resourceType}. Required: ${requiredAmount}, Available: ${available}`);
      }
    }

    const equippedItems = await this.db.query(
      `SELECT ii.*, s.weight
       FROM inventory_items ii
       JOIN skins s ON ii."skinId" = s.id
       WHERE ii."userId" = $1 AND ii."isEquipped" = true`,
      [userId]
    );

    const user = await this.db.findOne('users', { id: userId });
    if (!user) {
      throw new Error('User not found');
    }

    const currentWeight = equippedItems.rows.reduce((sum, item) => sum + (item.weight || 0), 0);
    const totalWeight = currentWeight + skin.weight;

    if (totalWeight > user.powerMax) {
      throw new Error('Not enough power to carry this item');
    }

    await this.db.transaction(async (client) => {
      for (const [resourceType, requiredAmount] of Object.entries(recipe.resources)) {
        await client.query(
          'UPDATE resources SET amount = amount - $1, "updatedAt" = $2 WHERE "userId" = $3 AND type = $4',
          [requiredAmount, new Date(), userId, resourceType]
        );
      }

      await client.query(
        `INSERT INTO inventory_items ("userId", "skinId", rarity, durability, "durabilityMax", weight, "isEquipped", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, false, $7, $8) RETURNING *`,
        [
          userId,
          skinId,
          skin.rarity,
          skin.durabilityMax,
          skin.durabilityMax,
          skin.weight,
          new Date(),
          new Date(),
        ]
      );
    });

    const item = await this.db.query(
      `SELECT ii.*, s.*
       FROM inventory_items ii
       JOIN skins s ON ii."skinId" = s.id
       WHERE ii."userId" = $1 AND ii."skinId" = $2
       ORDER BY ii."createdAt" DESC
       LIMIT 1`,
      [userId, skinId]
    ).then(r => r.rows[0]);

    return { success: true, item };
  }

  async getCraftRecipes(businessId: number) {
    const business = await this.db.findOne('businesses', { id: businessId });
    if (!business) {
      throw new Error('Business not found');
    }

    const recipes = this.getAllCraftRecipes(business.type);
    const craftableSkinTypes = recipes.map((r) => r.skinType);

    const skins = await this.db.query(
      `SELECT * FROM skins 
       WHERE type = ANY($1) 
       AND "isActive" = true 
       AND rarity IN ('COMMON', 'RARE')`,
      [craftableSkinTypes]
    );

    return skins.rows.map((skin) => {
      const recipe = recipes.find((r) => r.skinType === skin.type);
      return {
        skin,
        recipe: recipe ? recipe.resources : null,
      };
    });
  }

  private getCraftRecipe(businessType: string, skinType: string): { resources: Record<string, number> } | null {
    const recipes: Record<string, Record<string, { resources: Record<string, number> }>> = {
      BOARD_WORKSHOP: {
        BOARD: {
          resources: {
            WOOD: 10,
            METAL: 2,
          },
        },
      },
      DICE_FACTORY: {
        DICE: {
          resources: {
            BONE: 5,
            PLASTIC: 3,
          },
        },
      },
      CUPS_WORKSHOP: {
        CUP: {
          resources: {
            METAL: 8,
            LEATHER: 2,
          },
        },
        CHECKERS: {
          resources: {
            WOOD: 5,
            METAL: 1,
          },
        },
      },
    };

    return recipes[businessType]?.[skinType] || null;
  }

  private getAllCraftRecipes(businessType: string): Array<{ skinType: string; resources: Record<string, number> }> {
    const recipes: Record<string, Array<{ skinType: string; resources: Record<string, number> }>> = {
      BOARD_WORKSHOP: [
        {
          skinType: 'BOARD',
          resources: {
            WOOD: 10,
            METAL: 2,
          },
        },
      ],
      DICE_FACTORY: [
        {
          skinType: 'DICE',
          resources: {
            BONE: 5,
            PLASTIC: 3,
          },
        },
      ],
      CUPS_WORKSHOP: [
        {
          skinType: 'CUP',
          resources: {
            METAL: 8,
            LEATHER: 2,
          },
        },
        {
          skinType: 'CHECKERS',
          resources: {
            WOOD: 5,
            METAL: 1,
          },
        },
      ],
    };

    return recipes[businessType] || [];
  }

  async repairItemAtBusiness(
    userId: number,
    businessId: number,
    itemId: number,
    repairType: 'PARTIAL' | 'FULL',
  ) {
    const businessResult = await this.db.query(
      `SELECT b.*, u.*
       FROM businesses b
       JOIN users u ON b."userId" = u.id
       WHERE b.id = $1`,
      [businessId]
    );

    const business = businessResult.rows[0];
    if (!business) {
      throw new Error('Business not found');
    }

    const canRepair = ['BOARD_WORKSHOP', 'DICE_FACTORY', 'CUPS_WORKSHOP'].includes(business.type);
    if (!canRepair) {
      throw new Error('This business cannot repair items');
    }

    const itemResult = await this.db.query(
      `SELECT ii.*, s.*
       FROM inventory_items ii
       JOIN skins s ON ii."skinId" = s.id
       WHERE ii.id = $1`,
      [itemId]
    );

    const item = itemResult.rows[0];
    if (!item || item.userId !== userId) {
      throw new Error('Item not found or access denied');
    }

    const durabilityLost = item.durabilityMax - item.durability;
    if (durabilityLost === 0) {
      throw new Error('Item is already fully repaired');
    }

    const repairCostPartial = Math.floor(
      (durabilityLost / item.durabilityMax) * item.priceCoin * 0.3,
    );
    const repairCostFull = Math.floor(item.priceCoin * 0.5);
    const repairCost = repairType === 'FULL' ? repairCostFull : repairCostPartial;

    const user = await this.db.findOne('users', { id: userId });
    if (!user || user.narCoin < repairCost) {
      throw new Error('Not enough NAR coins');
    }

    const ownerShare = Math.floor(repairCost * 0.6);
    const durabilityRestored =
      repairType === 'FULL' ? durabilityLost : Math.floor(durabilityLost * 0.5);

    await this.db.transaction(async (client) => {
      await client.query(
        'UPDATE inventory_items SET durability = LEAST($1, $2 + $3), "updatedAt" = $4 WHERE id = $5',
        [item.durabilityMax, item.durability, durabilityRestored, new Date(), itemId]
      );
      await client.query(
        'UPDATE users SET "narCoin" = "narCoin" - $1 WHERE id = $2',
        [repairCost, userId]
      );

      if (business.userId !== userId && ownerShare > 0) {
        await client.query(
          'UPDATE users SET "narCoin" = "narCoin" + $1 WHERE id = $2',
          [ownerShare, business.userId]
        );
      }
    });

    const updated = await this.db.findOne('inventory_items', { id: itemId });
    return {
      item: updated,
      cost: repairCost,
      ownerShare,
      burnedAmount: repairCost - ownerShare,
    };
  }

  async getRepairBusinesses(itemType: string, districtId?: number) {
    const businessTypeMap: Record<string, string[]> = {
      BOARD: ['BOARD_WORKSHOP'],
      DICE: ['DICE_FACTORY'],
      CHECKERS: ['CUPS_WORKSHOP'],
      CUP: ['CUPS_WORKSHOP'],
      FRAME: ['BOARD_WORKSHOP', 'CUPS_WORKSHOP'],
    };

    const allowedTypes = businessTypeMap[itemType] || [];
    if (allowedTypes.length === 0) {
      return [];
    }

    let query = `SELECT b.*, u.id as "userId", u.nickname, u."firstName", d.id as "districtId", d.name as "districtName"
                 FROM businesses b
                 JOIN users u ON b."userId" = u.id
                 JOIN districts d ON b."districtId" = d.id
                 WHERE b.type = ANY($1)`;
    const params: any[] = [allowedTypes];

    if (districtId) {
      query += ` AND b."districtId" = $${params.length + 1}`;
      params.push(districtId);
    }

    query += ` ORDER BY b.level DESC`;

    const businesses = await this.db.query(query, params);

    return businesses.rows.map(b => ({
      ...b,
      user: {
        id: b.userId,
        nickname: b.nickname,
        firstName: b.firstName,
      },
      district: {
        id: b.districtId,
        name: b.districtName,
      },
    }));
  }

  async workAtBusiness(workerId: number, businessId: number, hours: number = 1) {
    const businessResult = await this.db.query(
      `SELECT b.*, u.*
       FROM businesses b
       JOIN users u ON b."userId" = u.id
       WHERE b.id = $1`,
      [businessId]
    );

    const business = businessResult.rows[0];
    if (!business) {
      throw new Error('Business not found');
    }

    const worker = await this.db.findOne('users', { id: workerId });
    if (!worker) {
      throw new Error('Worker not found');
    }

    if (business.userId === workerId) {
      throw new Error('Cannot work at your own business');
    }

    const energyCost = hours * 10;
    const salary = this.calculateSalary(business.type, business.level, hours);

    if (worker.energy < energyCost) {
      throw new Error(`Not enough energy. Required: ${energyCost}, Available: ${worker.energy}`);
    }

    if (business.narCoin < salary) {
      throw new Error('Business owner does not have enough NAR to pay salary');
    }

    await this.db.transaction(async (client) => {
      await client.query(
        'UPDATE users SET energy = energy - $1 WHERE id = $2',
        [energyCost, workerId]
      );
      await client.query(
        'UPDATE users SET "narCoin" = "narCoin" + $1 WHERE id = $2',
        [salary, workerId]
      );
      await client.query(
        'UPDATE users SET "narCoin" = "narCoin" - $1 WHERE id = $2',
        [salary, business.userId]
      );
    });

    return {
      success: true,
      energySpent: energyCost,
      salary,
      hours,
    };
  }

  async getAvailableJobs(districtId?: number) {
    if (districtId) {
      return this.getDistrictJobPostings(districtId);
    }

    const jobPostings = await this.db.query(
      `SELECT jp.*, b.*, u.id as "ownerId", u.nickname as "ownerNickname", u."firstName" as "ownerFirstName",
              d.*
       FROM job_postings jp
       JOIN businesses b ON jp."businessId" = b.id
       JOIN users u ON b."userId" = u.id
       JOIN districts d ON b."districtId" = d.id
       WHERE jp."isActive" = true
       ORDER BY jp."createdAt" DESC`
    );

    const jobPostingsWithEmployees = await Promise.all(
      jobPostings.rows.map(async (jp) => {
        const employees = await this.db.query(
          'SELECT * FROM job_employees WHERE "jobPostingId" = $1',
          [jp.id]
        );

        return {
          ...jp,
          business: {
            ...jp,
            user: {
              id: jp.ownerId,
              nickname: jp.ownerNickname,
              firstName: jp.ownerFirstName,
            },
            district: {
              id: jp.districtId,
              name: jp.name,
            },
          },
          employees: employees.rows,
        };
      })
    );

    return jobPostingsWithEmployees;
  }

  async createJobPosting(businessId: number, ownerId: number, data: {
    title: string;
    description?: string;
    salaryPerHour: number;
    energyPerHour?: number;
    maxWorkers?: number;
  }) {
    const business = await this.db.findOne('businesses', { id: businessId });
    if (!business || business.userId !== ownerId) {
      throw new Error('Business not found or user is not the owner');
    }

    return await this.db.create('job_postings', {
      businessId,
      title: data.title,
      description: data.description || null,
      salaryPerHour: data.salaryPerHour,
      energyPerHour: data.energyPerHour || 10,
      maxWorkers: data.maxWorkers || 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async getBusinessJobPostings(businessId: number) {
    const jobPostings = await this.db.findMany('job_postings', { businessId, isActive: true }, { orderBy: '"createdAt" DESC' });

    return await Promise.all(
      jobPostings.map(async (jp) => {
        const employees = await this.db.query(
          `SELECT je.*, u.id as "workerId", u.nickname, u."firstName", u."photoUrl"
           FROM job_employees je
           JOIN users u ON je."workerId" = u.id
           WHERE je."jobPostingId" = $1`,
          [jp.id]
        );

        return {
          ...jp,
          employees: employees.rows.map(e => ({
            ...e,
            worker: {
              id: e.workerId,
              nickname: e.nickname,
              firstName: e.firstName,
              photoUrl: e.photoUrl,
            },
          })),
        };
      })
    );
  }

  async getDistrictJobPostings(districtId: number) {
    const jobPostings = await this.db.query(
      `SELECT jp.*, b.*, u.id as "ownerId", u.nickname as "ownerNickname", u."firstName" as "ownerFirstName",
              d.*
       FROM job_postings jp
       JOIN businesses b ON jp."businessId" = b.id
       JOIN users u ON b."userId" = u.id
       JOIN districts d ON b."districtId" = d.id
       WHERE b."districtId" = $1 AND jp."isActive" = true
       ORDER BY jp."createdAt" DESC`,
      [districtId]
    );

    const jobPostingsWithEmployees = await Promise.all(
      jobPostings.rows.map(async (jp) => {
        const employees = await this.db.query(
          'SELECT * FROM job_employees WHERE "jobPostingId" = $1',
          [jp.id]
        );

        return {
          ...jp,
          business: {
            ...jp,
            user: {
              id: jp.ownerId,
              nickname: jp.ownerNickname,
              firstName: jp.ownerFirstName,
            },
            district: {
              id: jp.districtId,
              name: jp.name,
            },
          },
          employees: employees.rows,
        };
      })
    );

    return jobPostingsWithEmployees;
  }

  async deleteJobPosting(jobPostingId: number, ownerId: number) {
    const jobPosting = await this.db.query(
      `SELECT jp.*, b."userId"
       FROM job_postings jp
       JOIN businesses b ON jp."businessId" = b.id
       WHERE jp.id = $1`,
      [jobPostingId]
    ).then(r => r.rows[0]);

    if (!jobPosting || jobPosting.userId !== ownerId) {
      throw new Error('Job posting not found or user is not the owner');
    }

    return await this.db.update('job_postings',
      { id: jobPostingId },
      { isActive: false, updatedAt: new Date() }
    );
  }

  async applyForJob(jobPostingId: number, workerId: number) {
    const jobPostingResult = await this.db.query(
      `SELECT jp.*, b."userId" as "businessOwnerId"
       FROM job_postings jp
       JOIN businesses b ON jp."businessId" = b.id
       WHERE jp.id = $1`,
      [jobPostingId]
    );

    const jobPosting = jobPostingResult.rows[0];
    if (!jobPosting || !jobPosting.isActive) {
      throw new Error('Job posting not found or not active');
    }

    const employees = await this.db.query(
      'SELECT * FROM job_employees WHERE "jobPostingId" = $1',
      [jobPostingId]
    );

    if (employees.rows.length >= jobPosting.maxWorkers) {
      throw new Error('Job posting is full');
    }

    const existing = employees.rows.find(e => e.workerId === workerId);
    if (existing) {
      throw new Error('Already working at this job');
    }

    if (jobPosting.businessOwnerId === workerId) {
      throw new Error('Cannot work at your own business');
    }

    return await this.db.create('job_employees', {
      jobPostingId,
      workerId,
      hoursWorked: 0,
      totalEarned: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async workAtJob(jobPostingId: number, workerId: number, hours: number = 1) {
    const jobPostingResult = await this.db.query(
      `SELECT jp.*, b."userId" as "businessOwnerId", u."narCoin" as "ownerNarCoin"
       FROM job_postings jp
       JOIN businesses b ON jp."businessId" = b.id
       JOIN users u ON b."userId" = u.id
       WHERE jp.id = $1`,
      [jobPostingId]
    );

    const jobPosting = jobPostingResult.rows[0];
    if (!jobPosting || !jobPosting.isActive) {
      throw new Error('Job posting not found or not active');
    }

    const employeeResult = await this.db.query(
      'SELECT * FROM job_employees WHERE "jobPostingId" = $1 AND "workerId" = $2 LIMIT 1',
      [jobPostingId, workerId]
    );

    const employee = employeeResult.rows[0];
    if (!employee) {
      throw new Error('Not hired for this job. Apply first.');
    }

    const worker = await this.db.findOne('users', { id: workerId });
    if (!worker) {
      throw new Error('Worker not found');
    }

    const energyCost = hours * jobPosting.energyPerHour;
    const salary = jobPosting.salaryPerHour * hours;

    if (worker.energy < energyCost) {
      throw new Error(`Not enough energy. Required: ${energyCost}, Available: ${worker.energy}`);
    }

    if (jobPosting.ownerNarCoin < salary) {
      throw new Error('Business owner does not have enough NAR to pay salary');
    }

    await this.db.transaction(async (client) => {
      await client.query(
        'UPDATE users SET energy = energy - $1 WHERE id = $2',
        [energyCost, workerId]
      );
      await client.query(
        'UPDATE users SET "narCoin" = "narCoin" + $1 WHERE id = $2',
        [salary, workerId]
      );
      await client.query(
        'UPDATE users SET "narCoin" = "narCoin" - $1 WHERE id = $2',
        [salary, jobPosting.businessOwnerId]
      );
      await client.query(
        `UPDATE job_employees SET 
          "hoursWorked" = "hoursWorked" + $1,
          "totalEarned" = "totalEarned" + $2,
          "lastWorked" = $3,
          "updatedAt" = $4
         WHERE id = $5`,
        [hours, salary, new Date(), new Date(), employee.id]
      );
    });

    const updatedEmployee = await this.db.query(
      'SELECT * FROM job_employees WHERE id = $1',
      [employee.id]
    ).then(r => r.rows[0]);

    return {
      salary,
      energyCost,
      hoursWorked: updatedEmployee.hoursWorked,
      totalEarned: updatedEmployee.totalEarned,
    };
  }

  private getBusinessCreationCost(type: string): number {
    const costs: Record<string, number> = {
      COURT_TABLE: 50,
      BOARD_WORKSHOP: 200,
      DICE_FACTORY: 300,
      CUPS_WORKSHOP: 250,
      CLUB: 500,
      SCHOOL: 400,
      ARENA: 1000,
    };
    return costs[type] || 100;
  }

  private getBaseIncomePerHour(type: string): number {
    const income: Record<string, number> = {
      COURT_TABLE: 5,
      BOARD_WORKSHOP: 20,
      DICE_FACTORY: 30,
      CUPS_WORKSHOP: 25,
      CLUB: 50,
      SCHOOL: 40,
      ARENA: 100,
    };
    return income[type] || 10;
  }

  private getBaseProductionPerHour(type: string): number | null {
    const production: Record<string, number> = {
      BOARD_WORKSHOP: 1,
      DICE_FACTORY: 2,
      CUPS_WORKSHOP: 1,
    };
    return production[type] || null;
  }

  private getBaseStorageLimit(type: string): number | null {
    const storage: Record<string, number> = {
      BOARD_WORKSHOP: 50,
      DICE_FACTORY: 100,
      CUPS_WORKSHOP: 75,
    };
    return storage[type] || null;
  }

  private getBaseMaintenanceCost(type: string): number {
    const maintenance: Record<string, number> = {
      COURT_TABLE: 1,
      BOARD_WORKSHOP: 5,
      DICE_FACTORY: 10,
      CUPS_WORKSHOP: 7,
      CLUB: 15,
      SCHOOL: 12,
      ARENA: 30,
    };
    return maintenance[type] || 5;
  }

  private getUpgradeCost(type: string, level: number): number {
    const baseCost = this.getBusinessCreationCost(type);
    return baseCost * level * 2;
  }

  private getIncomeIncrease(type: string): number {
    return this.getBaseIncomePerHour(type) * 0.5;
  }

  private getProductionIncrease(type: string): number {
    const base = this.getBaseProductionPerHour(type);
    return base ? Math.ceil(base * 0.3) : 0;
  }

  private getStorageIncrease(type: string): number {
    const base = this.getBaseStorageLimit(type);
    return base ? Math.ceil(base * 0.2) : 0;
  }

  private getMaintenanceIncrease(type: string): number {
    return this.getBaseMaintenanceCost(type) * 0.3;
  }

  private getResourceTypeForBusiness(type: string): string {
    const mapping: Record<string, string> = {
      BOARD_WORKSHOP: 'WOOD',
      DICE_FACTORY: 'BONE',
      CUPS_WORKSHOP: 'METAL',
    };
    return mapping[type] || 'WOOD';
  }

  private calculateSalary(businessType: string, level: number, hours: number): number {
    const baseSalaries: Record<string, number> = {
      COURT_TABLE: 5,
      BOARD_WORKSHOP: 15,
      DICE_FACTORY: 20,
      CUPS_WORKSHOP: 18,
      CLUB: 30,
      SCHOOL: 25,
      ARENA: 50,
    };

    const baseSalary = baseSalaries[businessType] || 10;
    const salaryPerHour = baseSalary * (1 + (level - 1) * 0.2);
    return Math.floor(salaryPerHour * hours);
  }
}
