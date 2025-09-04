"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FAQItemProps {
  question: string;
  answer: string;
  tags?: string[];
  isOpen?: boolean;
  onToggle?: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({
  question,
  answer,
  tags,
  isOpen = false,
  onToggle,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = onToggle !== undefined;
  const open = isControlled ? isOpen : internalOpen;

  const handleToggle = () => {
    if (isControlled) {
      onToggle?.();
    } else {
      setInternalOpen(!internalOpen);
    }
  };

  return (
    <Card className="border border-gray-200 hover:border-yellow-300 transition-colors">
      <CardContent className="p-0">
        <button
          onClick={handleToggle}
          className="w-full p-4 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 mb-2">{question}</h3>
              {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs bg-yellow-100 text-yellow-700"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <div className="flex-shrink-0 pt-1">
              {open ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </button>

        {open && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="pt-3">
              <p className="text-gray-700 leading-relaxed">{answer}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FAQItem;
