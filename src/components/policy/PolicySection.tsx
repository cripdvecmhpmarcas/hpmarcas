import React from "react";
import { PolicySection as PolicySectionType } from "@/data/privacy-policy";

interface PolicySectionProps {
  section: PolicySectionType;
}

const PolicySectionComponent: React.FC<PolicySectionProps> = ({ section }) => {
  const renderContent = (content: string | string[]) => {
    if (typeof content === "string") {
      // Handle markdown-style links
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      const parts = content.split(linkRegex);

      return (
        <p className="text-gray-700 leading-relaxed">
          {parts.map((part, index) => {
            if (index % 3 === 0) {
              return formatText(part);
            } else if (index % 3 === 1) {
              const url = parts[index + 1];
              return (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-600 hover:text-yellow-700 hover:underline transition-colors"
                >
                  {part}
                </a>
              );
            }
            return null;
          })}
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {content.map((item, index) => (
          <p key={index} className="text-gray-700 leading-relaxed">
            {formatText(item)}
          </p>
        ))}
      </div>
    );
  };

  const formatText = (text: string) => {
    // Handle bold text
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = text.split(boldRegex);

    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <strong key={index} className="font-semibold text-gray-900">
            {part}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">
        {section.title}
      </h2>

      {section.content && renderContent(section.content)}

      {section.subsections && (
        <div className="mt-4 space-y-4">
          {section.subsections.map((subsection, index) => (
            <div key={index}>
              <h3 className="font-semibold text-lg mb-2 text-gray-800">
                {subsection.title}
              </h3>
              <div className="ml-4 space-y-2">
                {subsection.items.map((item, itemIndex) => (
                  <p key={itemIndex} className="text-gray-700">
                    • {item}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default PolicySectionComponent;
