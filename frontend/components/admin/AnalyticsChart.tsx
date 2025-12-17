import React from 'react';
import { motion } from 'framer-motion';

interface ChartData {
    label: string;
    value: number;
    color?: string;
}

interface AnalyticsChartProps {
    title: string;
    data: ChartData[];
    type: 'bar' | 'line' | 'pie' | 'donut';
    height?: number;
    className?: string;
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ 
    title, 
    data, 
    type, 
    height = 200, 
    className = '' 
}) => {
    const maxValue = Math.max(...data.map(d => d.value));

    const renderBarChart = () => {
        // Optimizar para móvil: rotar labels si hay muchos datos
        const shouldRotate = data.length > 10;
        
        return (
            <div className="flex items-end justify-between h-full space-x-1 sm:space-x-2 overflow-x-auto pb-8 sm:pb-4">
                {data.map((item, index) => (
                    <motion.div
                        key={item.label}
                        className="flex flex-col items-center flex-1 min-w-[40px] sm:min-w-[50px]"
                        initial={{ height: 0 }}
                        animate={{ height: '100%' }}
                        transition={{ delay: index * 0.05, duration: 0.5 }}
                    >
                        <div className="flex flex-col items-center h-full justify-end w-full">
                            <div
                                className={`w-full rounded-t ${
                                    item.color || 'bg-blue-500'
                                }`}
                                style={{
                                    height: `${(item.value / maxValue) * 100}%`,
                                    minHeight: '4px'
                                }}
                            />
                            <div className={`text-xs text-gray-600 mt-1 sm:mt-2 text-center ${shouldRotate ? 'transform -rotate-45 origin-bottom-left whitespace-nowrap' : ''}`}>
                                <div className="font-medium text-xs">{item.value >= 1000 ? `${(item.value / 1000).toFixed(1)}k` : item.value.toLocaleString()}</div>
                                <div className={`text-xs ${shouldRotate ? 'hidden sm:block' : ''}`}>{item.label}</div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        );
    };

    const renderLineChart = () => (
        <div className="relative h-full">
            <svg className="w-full h-full" viewBox="0 0 300 200">
                <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8"/>
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1"/>
                    </linearGradient>
                </defs>
                
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map(y => (
                    <line
                        key={y}
                        x1="0"
                        y1={y * 2}
                        x2="300"
                        y2={y * 2}
                        stroke="#e5e7eb"
                        strokeWidth="1"
                    />
                ))}
                
                {/* Data line */}
                <motion.path
                    d={data.map((item, index) => {
                        const x = (index / (data.length - 1)) * 280 + 10;
                        const y = 200 - (item.value / maxValue) * 180;
                        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    stroke="#3b82f6"
                    strokeWidth="2"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                />
                
                {/* Area under line */}
                <motion.path
                    d={`${data.map((item, index) => {
                        const x = (index / (data.length - 1)) * 280 + 10;
                        const y = 200 - (item.value / maxValue) * 180;
                        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')} L 290 200 L 10 200 Z`}
                    fill="url(#lineGradient)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                />
                
                {/* Data points */}
                {data.map((item, index) => {
                    const x = (index / (data.length - 1)) * 280 + 10;
                    const y = 200 - (item.value / maxValue) * 180;
                    return (
                        <motion.circle
                            key={index}
                            cx={x}
                            cy={y}
                            r="4"
                            fill="#3b82f6"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 + 0.5 }}
                        />
                    );
                })}
            </svg>
        </div>
    );

    const renderPieChart = () => {
        const total = data.reduce((sum, item) => sum + item.value, 0);
        let currentAngle = 0;
        
        return (
            <div className="relative h-full flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 200 200">
                    {data.map((item, index) => {
                        const percentage = (item.value / total) * 100;
                        const angle = (item.value / total) * 360;
                        const startAngle = currentAngle;
                        const endAngle = currentAngle + angle;
                        
                        const startAngleRad = (startAngle * Math.PI) / 180;
                        const endAngleRad = (endAngle * Math.PI) / 180;
                        
                        const x1 = 100 + 80 * Math.cos(startAngleRad);
                        const y1 = 100 + 80 * Math.sin(startAngleRad);
                        const x2 = 100 + 80 * Math.cos(endAngleRad);
                        const y2 = 100 + 80 * Math.sin(endAngleRad);
                        
                        const largeArcFlag = angle > 180 ? 1 : 0;
                        
                        const pathData = [
                            `M 100 100`,
                            `L ${x1} ${y1}`,
                            `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                            `Z`
                        ].join(' ');
                        
                        currentAngle += angle;
                        
                        return (
                            <motion.path
                                key={index}
                                d={pathData}
                                fill={item.color || `hsl(${index * 60}, 70%, 50%)`}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                            />
                        );
                    })}
                </svg>
                
                {/* Center text */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-800">{total}</div>
                        <div className="text-sm text-gray-600">Total</div>
                    </div>
                </div>
            </div>
        );
    };

    const renderChart = () => {
        switch (type) {
            case 'bar':
                return renderBarChart();
            case 'line':
                return renderLineChart();
            case 'pie':
            case 'donut':
                return renderPieChart();
            default:
                return renderBarChart();
        }
    };

    return (
        <div className={`bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 ${className}`}>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">{title}</h3>
            <div style={{ height: `${height}px` }} className="relative">
                {renderChart()}
            </div>
            
            {/* Legend for pie charts - Optimizado para móvil */}
            {(type === 'pie' || type === 'donut') && (
                <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 sm:gap-4 justify-center">
                    {data.map((item, index) => (
                        <div key={index} className="flex items-center gap-1.5 sm:gap-2">
                            <div
                                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: item.color || `hsl(${index * 60}, 70%, 50%)` }}
                            />
                            <span className="text-xs sm:text-sm text-gray-600">{item.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AnalyticsChart;
