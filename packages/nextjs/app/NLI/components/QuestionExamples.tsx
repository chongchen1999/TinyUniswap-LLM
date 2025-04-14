import React from "react";

interface QuestionExamplesProps {
  onExampleClick?: (text: string) => void;
}

const QuestionExamples: React.FC<QuestionExamplesProps> = ({ onExampleClick }) => {
  const easyQuestions = [
    "Swap 5 TokenA for TokenB", 
    "Deposit 10 TokenA and 10 TokenB to the TokenA-TokenB pool", 
    "Withdraw 5 of my liquidity tokens in the TokenA-TokenB pool", 
    "What are the reserves of the TokenA-TokenB pool?", 
    "Show me all the liquidity pools",
    "How much liquidity I have in each pool", 
    "How many swaps have there been in the TokenA-TokenB pool today?", 
    "What is the current price of TokenB in TokenA?", 
    "How much liquidity do I have in the TokenA-TokenB pool?", 
    "Show me the balance of my wallet",
  ];
  
  const hardQuestions = [
    "What is the best route to swap 5 ETH to TokenB? Draw a conclusion by calculation.", 
    "I want to gain 20 liquidity tokens for the TokenA-TokenB pool, how much TokenA and TokenB do I need to provide?",    "Do I have enough tokens to provide 15% of TokenA-TokenB pool liquidity?",
    "I want to get 10 TokenA, how many liquidity tokens do I need to withdraw from the TokenA-TokenB pool?",
    "How do I swap so the ratio of TokenA:TokenB in the TokenA-TokenB pool is 1:2?",
    "What percentage of liquidity should I provide to double the reserves of the TokenA-TokenB pool?",
    "Calculate my projected APY from fees in the TokenA-TokenB pool",
    "Show me price history of TokenA-TokenB pool for the last 7 days",
    "What's the slippage if I swap 10 TokenA for TokenB?",
    "What's the optimal ratio to provide TokenA-TokenB liquidity?",
    "What's the price impact of swapping 20% of TokenA-TokenB reserves?",
  ];

  const handleClick = (question: string) => {
    // Copy to clipboard
    navigator.clipboard.writeText(question)
      .then(() => {
        // If onExampleClick callback is provided, call it
        if (onExampleClick) {
          onExampleClick(question);
        }
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  return (
    <div className="mb-4">
      <p className="text-lg mb-4">
        Ask questions or give commands in plain English:
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Easy Questions Column */}
        <div className="bg-base-200 rounded-lg p-5 shadow-inner">
          <h3 className="font-bold text-primary text-lg mb-4">Easy Examples</h3>
          <ul className="space-y-3">
            {easyQuestions.map((question, index) => (
              <li key={`easy-${index}`} 
                  className="cursor-pointer hover:bg-base-300 p-3 rounded-md transition-all border border-transparent hover:border-primary"
                  onClick={() => handleClick(question)}>
                {question}
              </li>
            ))}
          </ul>
        </div>
        
        {/* Hard Questions Column */}
        <div className="bg-base-200 rounded-lg p-5 shadow-inner">
          <h3 className="font-bold text-secondary text-lg mb-4">Advanced Examples</h3>
          <ul className="space-y-3">
            {hardQuestions.map((question, index) => (
              <li key={`hard-${index}`} 
                  className="cursor-pointer hover:bg-base-300 p-3 rounded-md transition-all border border-transparent hover:border-secondary"
                  onClick={() => handleClick(question)}>
                {question}
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="mt-4 text-center text-gray-600 text-sm">
        Click any example to copy it to your clipboard
      </div>
    </div>
  );
};

export default QuestionExamples;