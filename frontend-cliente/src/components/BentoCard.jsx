import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '../lib/utils';

const BentoCard = ({
    title,
    subtitle,
    className,
    videoSrc,
    imageSrc,
    href = "#",
    large = false,
    children
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const videoRef = useRef(null);

    const handleMouseEnter = () => {
        setIsHovered(true);
        if (videoRef.current) {
            videoRef.current.play().catch(e => console.log("Video play failed", e));
        }
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    };

    return (
        <motion.div
            className={cn(
                "relative overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800 group cursor-pointer block",
                large ? "col-span-1 md:col-span-2 row-span-2" : "col-span-1 row-span-1",
                className
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
        >
            {/* Media Background */}
            <div className="absolute inset-0 w-full h-full z-0">
                {imageSrc && (
                    <img
                        src={imageSrc}
                        alt={title || "Background"}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-50 group-hover:opacity-30"
                        onError={(e) => {
                            // Fallback a un gradiente si la imagen falla
                            e.target.style.display = 'none';
                        }}
                    />
                )}
                {/* Fallback gradient si no hay imagen o falla */}
                {(!imageSrc || imageSrc.includes('/large/')) && (
                    <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 via-neutral-900 to-black" />
                )}
                {videoSrc && (
                    <video
                        ref={videoRef}
                        src={videoSrc}
                        loop
                        muted
                        playsInline
                        className={cn(
                            "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
                            isHovered ? "opacity-40" : "opacity-0"
                        )}
                    />
                )}
                {/* Overlay gradient - Stronger for data readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
            </div>

            {/* Content */}
            <div className="relative z-10 h-full w-full p-6">
                {children ? (
                    children
                ) : (
                    <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col justify-end h-full">
                        <div className="transform transition-transform duration-300 group-hover:-translate-y-2">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xl font-medium text-white">{title}</h3>
                                <ArrowUpRight className="w-5 h-5 text-white opacity-0 -translate-x-2 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0" />
                            </div>
                            <p className="text-sm text-neutral-400 line-clamp-2">{subtitle}</p>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default BentoCard;

