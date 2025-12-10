import { ReactNode, useState } from 'react';
import './Tabs.css';

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
}

export const Tabs = ({ tabs, defaultTab, onChange }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div className="tabs">
      <div className="tabs__header">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tabs__tab ${activeTab === tab.id ? 'tabs__tab--active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tabs__content">{activeTabContent}</div>
    </div>
  );
};

