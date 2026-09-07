'use client';
import React, { useEffect, useRef } from 'react';
import styles from './Hero.module.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Hero = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Basic intro animation
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      
      tl.fromTo(titleRef.current, 
        { y: '100%', opacity: 0 },
        { y: '0%', opacity: 1, duration: 1.2, ease: "power4.out" }
      );
      
      tl.fromTo(textRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out" },
        "-=0.8"
      );
    }, sectionRef);

    // Canvas 3D Logic
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    
    // Set internal canvas resolution (handle retina displays)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    context.scale(dpr, dpr);

    // 3D Sphere points generation (Fibonacci sphere)
    const points: {x: number, y: number, z: number}[] = [];
    const numPoints = 150;
    let baseRadius = Math.min(width, height) * 0.4;
    
    for (let i = 0; i < numPoints; i++) {
      const phi = Math.acos(-1 + (2 * i) / numPoints);
      const theta = Math.sqrt(numPoints * Math.PI) * phi;
      points.push({
        x: Math.cos(theta) * Math.sin(phi),
        y: Math.sin(theta) * Math.sin(phi),
        z: Math.cos(phi)
      });
    }

    // Proxy object that GSAP will animate based on scroll
    const animProxy = { rotY: 0, rotX: 0, zoom: 1 };

    gsap.to(animProxy, {
      rotY: Math.PI * 2, // one full rotation
      rotX: Math.PI / 2, // tilt down
      zoom: 1.8,
      ease: "none",
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom top", // animate across the hero's scroll distance
        scrub: 1, // smooth scrubbing
      }
    });

    let animationFrameId: number;

    const render = () => {
      context.clearRect(0, 0, width, height);
      
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = baseRadius * animProxy.zoom;
      
      const { rotY, rotX } = animProxy;
      const sinY = Math.sin(rotY);
      const cosY = Math.cos(rotY);
      const sinX = Math.sin(rotX);
      const cosX = Math.cos(rotX);

      // Project 3D points to 2D
      const projectedPoints = points.map(p => {
        // Rotate Y
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.z * cosY + p.x * sinY;
        
        // Rotate X
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.y * sinX;

        // Simple perspective projection
        const scaleProject = 2 / (2 + z2); // Camera distance roughly 2
        
        return {
          x: centerX + x1 * radius * scaleProject,
          y: centerY + y2 * radius * scaleProject,
          scale: scaleProject,
          z: z2 // keep z for opacity / drawing logic
        };
      });

      // Draw connections (wireframe network)
      context.strokeStyle = 'rgba(63, 63, 70, 0.2)'; // Zinc 700 with opacity
      context.lineWidth = 1;
      
      for(let i = 0; i < projectedPoints.length; i++) {
        for(let j = i + 1; j < projectedPoints.length; j++) {
          const p1 = projectedPoints[i];
          const p2 = projectedPoints[j];
          // Connect points that are close to each other
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = dx*dx + dy*dy;
          
          if(dist < (radius * radius * 0.15)) {
            // Fade out lines going to the back of the sphere
            const avgZ = (p1.z + p2.z) / 2;
            if (avgZ < 0.5) { // Only draw front/middle facing lines
               context.beginPath();
               context.moveTo(p1.x, p1.y);
               context.lineTo(p2.x, p2.y);
               context.stroke();
            }
          }
        }
      }

      // Draw points
      for (const p of projectedPoints) {
        // Points closer to camera (lower z) are more opaque and larger
        const opacity = Math.max(0.1, 1 - (p.z + 1) / 2);
        const pointSize = Math.max(1, p.scale * 3);
        
        context.fillStyle = `rgba(23, 23, 23, ${opacity})`; // Neutral 900
        context.beginPath();
        context.arc(p.x, p.y, pointSize, 0, Math.PI * 2);
        context.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Handle Resize using ResizeObserver to catch layout shifts (e.g. font loading)
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      // Re-calculate base radius on resize
      baseRadius = Math.min(width, height) * 0.4;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      context.scale(dpr, dpr);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    return () => {
      ctx.revert();
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <section id="home" className={styles.hero} ref={sectionRef}>
      <div className={styles.container}>
        <div className={styles.leftCol}>
          <div className={styles.titleMask}>
            <h1 className={styles.massiveTitle} ref={titleRef}>
              THE<br/>
              FUTURE<br/>
              OF<br/>
              INTERVIEW.
            </h1>
          </div>
          <div className={styles.textContent} ref={textRef}>
            <p className={styles.description}>
              Phân tích CV, đối chiếu JD, và phỏng vấn 1-1 với AI. Cấu trúc STAR nguyên bản. 
              Dành cho những ứng viên muốn kiểm soát hoàn toàn kết quả của mình.
            </p>
            <div className={styles.actions}>
              <button className={styles.brutalButton}>BẮT ĐẦU NGAY</button>
              <button className={styles.ghostButton}>XEM DEMO</button>
            </div>
          </div>
        </div>
        <div className={styles.rightCol}>
          {/* Replaced static image with GSAP Scrubbed Canvas */}
          <canvas ref={canvasRef} className={styles.canvas3D}></canvas>
        </div>
      </div>
    </section>
  );
};

export default Hero;
