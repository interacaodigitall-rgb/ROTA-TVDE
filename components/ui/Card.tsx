import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ children, className = '' }, ref) => {
    return (
        <div ref={ref} className={`bg-gray-800 border border-gray-700 shadow-lg rounded-lg p-6 ${className}`}>
            {children}
        </div>
    );
});


export default Card;