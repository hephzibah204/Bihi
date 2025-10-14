import React, { useState } from 'react';
import ChevronDownIcon from './icons/ChevronDownIcon';
import { LandingPageContent } from '../types';

// Define props for the individual item
interface FAQItemProps {
  q: string;
  a: string;
  open: boolean;
  setOpen: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ q, a, open, setOpen }) => (
  <div className="faq-item" data-open={open}>
    <button className="faq-question" onClick={setOpen} aria-expanded={open}>
      <span className="text-lg text-left">{q}</span>
      <ChevronDownIcon className={`w-5 h-5 transition-transform flex-shrink-0 ${open ? 'rotate-180 text-indigo-600' : ''}`} />
    </button>
    <div className="faq-answer" aria-hidden={!open}>
      <div>
        <p className="text-gray-600">{a}</p>
      </div>
    </div>
  </div>
);

// Define props for the main component
interface FAQProps {
  content: LandingPageContent['faq'];
}

const FAQ: React.FC<FAQProps> = ({ content }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!content || !content.items) {
      return null;
  }

  return (
    <section id="faq" className="py-24 bg-gray-50">
      <div className="container mx-auto px-6 max-w-4xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900">{content.title}</h2>
        <div className="mt-12">
          {content.items.map((item, index) => (
            <FAQItem
              key={index}
              q={item.q}
              a={item.a}
              open={index === openIndex}
              setOpen={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
