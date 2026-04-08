import React, { useEffect, useRef, useState } from 'react';
import { Player, Team } from './types';

interface BowlingCanvasProps {
  currentPlayer: Player;
  onBowl: (pinsKnocked: number) => void;
}

const BowlingCanvas: React.FC<BowlingCanvasProps> = ({ currentPlayer, onBowl }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAiming, setIsAiming] = useState(true);
  const [isRolling, setIsRolling] = useState(false);
  const [power, setPower] = useState(0);
  const [spin, setSpin] = useState(0);
  
  const isChargingRef = useRef(false);
  const powerRef = useRef(0);
  const spinRef = useRef(0);

  const aimAngleRef = useRef(0);
  const ballPos = useRef({ x: 150, y: 360 });
  const ballVel = useRef({ x: 0, y: 0 });
  const ballSpin = useRef(0);
  const isGutter = useRef(false);
  const pins = useRef<{ x: number; y: number; vx: number; vy: number; rotation: number; rotationVel: number; isKnocked: boolean; length: number; fallProgress: number }[]>([]);
  const chargeStartPos = useRef({ x: 0, y: 0 });
  const triggerY = 170; // Just before the head pin (startY is 120)
  const isTriggeredRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const isRollingRef = useRef(false);

  // Initialize pins in a triangle
  const initPins = () => {
    const newPins = [];
    const startX = 150;
    const startY = 120;
    const spacing = 36;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col <= row; col++) {
        newPins.push({
          x: startX + (col - row / 2) * spacing,
          y: startY - row * spacing,
          vx: 0,
          vy: 0,
          rotation: 0,
          rotationVel: 0,
          isKnocked: false,
          length: 0,
          fallProgress: 0,
        });
      }
    }
    pins.current = newPins;
    isTriggeredRef.current = false;
    timerRef.current = null;
    isGutter.current = false;
    ballPos.current = { x: 150, y: 360 };
    ballVel.current = { x: 0, y: 0 };
    isRollingRef.current = false;
    setIsRolling(false);
    setIsAiming(true);
  };

  useEffect(() => {
    initPins();
  }, [currentPlayer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = Date.now();

    const update = () => {
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      let anyMoving = false;

      if (isRollingRef.current) {
        anyMoving = true;
        
        // Gutter check
        if (!isGutter.current && (ballPos.current.x < 40 || ballPos.current.x > 260)) {
          isGutter.current = true;
          ballVel.current.x = 0;
          ballSpin.current = 0;
        }

        // Apply spin (horizontal acceleration) - reduced by half
        if (!isGutter.current) {
          ballVel.current.x += ballSpin.current * 0.075;
        }
        
        ballPos.current.x += ballVel.current.x;
        ballPos.current.y += ballVel.current.y;

        // Trigger check
        if (!isTriggeredRef.current && ballPos.current.y < triggerY) {
          isTriggeredRef.current = true;
          timerRef.current = 3; // 3 second countdown
        }

        // Ball-Pin Collision (Only if not in gutter)
        if (!isGutter.current) {
          pins.current.forEach((pin) => {
            const dx = ballPos.current.x - pin.x;
            const dy = ballPos.current.y - pin.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            const pinRadius = pin.isKnocked ? 9 : 6;
            if (dist < 9 + pinRadius) {
              if (!pin.isKnocked) {
                pin.isKnocked = true;
                pin.rotationVel = (Math.random() - 0.5) * 0.5;
              }
              // Transfer momentum
              const angleToPin = Math.atan2(-dy, -dx); // From ball to pin
              const ballSpeed = Math.sqrt(ballVel.current.x ** 2 + ballVel.current.y ** 2);
              const force = ballSpeed * 0.85;
              pin.vx += Math.cos(angleToPin) * force;
              pin.vy += Math.sin(angleToPin) * force;
              pin.rotationVel += (Math.random() - 0.5) * force * 0.15;
              
              // Slow down ball
              ballVel.current.x *= 0.94;
              ballVel.current.y *= 0.94;

              // Separate ball and pin
              const angleToBall = Math.atan2(dy, dx); // From pin to ball
              const overlap = (9 + pinRadius) - dist;
              ballPos.current.x += Math.cos(angleToBall) * overlap;
              ballPos.current.y += Math.sin(angleToBall) * overlap;
            }
          });
        }

        // Check if ball is out of bounds
        if (ballPos.current.y < -50 || ballPos.current.x < 0 || ballPos.current.x > 300 || ballPos.current.y > 650) {
          ballVel.current = { x: 0, y: 0 };
          // If we missed everything and went out of bounds, we still need the trigger to end the turn
          if (!isTriggeredRef.current) {
            isTriggeredRef.current = true;
            timerRef.current = 2; // Shorter timer if ball is already gone
          }
        }
      }

      // Timer logic
      if (timerRef.current !== null) {
        timerRef.current -= dt;
        if (timerRef.current <= 0) {
          timerRef.current = null;
          isRollingRef.current = false;
          const knockedCount = pins.current.filter(p => p.isKnocked).length;
          onBowl(knockedCount);
        }
      }

      // Pin Physics
      pins.current.forEach((pin, i) => {
        if (pin.vx !== 0 || pin.vy !== 0 || pin.rotationVel !== 0 || (pin.isKnocked && pin.fallProgress < 1)) {
          anyMoving = true;
          pin.x += pin.vx;
          pin.y += pin.vy;
          pin.rotation += pin.rotationVel;

          if (pin.isKnocked && pin.fallProgress < 1) {
            pin.fallProgress += 0.1;
            pin.length = pin.fallProgress * 16;
          }

          // Friction - Reduced to make pins slide more
          const friction = pin.isKnocked ? 0.97 : 0.98;
          pin.vx *= friction;
          pin.vy *= friction;
          pin.rotationVel *= 0.95;

          if (Math.abs(pin.vx) < 0.1) pin.vx = 0;
          if (Math.abs(pin.vy) < 0.1) pin.vy = 0;
          if (Math.abs(pin.rotationVel) < 0.005) pin.rotationVel = 0;

          // Wall Bouncing (Narrower lane: 40 to 260)
          if (pin.x < 48) { // 40 + radius 8
            pin.x = 48;
            pin.vx *= -0.1; // Even lower bounce
            pin.rotationVel += pin.vy * 0.002;
          }
          if (pin.x > 252) { // 260 - radius 8
            pin.x = 252;
            pin.vx *= -0.1; // Even lower bounce
            pin.rotationVel -= pin.vy * 0.002;
          }
          if (pin.y < 8) { // Top wall
            pin.y = 8;
            pin.vy *= -0.3;
          }

          // Pin Setter Arm (Trigger Line)
          if (isTriggeredRef.current && pin.y > triggerY - 8 && pin.vy > 0) {
            pin.y = triggerY - 8;
            pin.vy *= -0.2; // Lower bounce off arm
          }

          // Pin-Pin Collision
          pins.current.forEach((otherPin, j) => {
            if (j <= i) return;
            const dx = otherPin.x - pin.x;
            const dy = otherPin.y - pin.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            const r1 = pin.isKnocked ? 9 : 6;
            const r2 = otherPin.isKnocked ? 9 : 6;
            
            if (dist < r1 + r2) {
              if (!otherPin.isKnocked || !pin.isKnocked) {
                if (!otherPin.isKnocked) {
                  otherPin.isKnocked = true;
                }
                if (!pin.isKnocked) {
                  pin.isKnocked = true;
                }
                otherPin.rotationVel += (Math.random() - 0.5) * 0.15;
                pin.rotationVel += (Math.random() - 0.5) * 0.15;
              }
              
              const angle = Math.atan2(dy, dx);
              const combinedVel = Math.sqrt(pin.vx ** 2 + pin.vy ** 2) + Math.sqrt(otherPin.vx ** 2 + otherPin.vy ** 2);
              const force = combinedVel * 0.4 + 0.1; // Reduced force
              
              const targetVx = Math.cos(angle) * force;
              const targetVy = Math.sin(angle) * force;
              
              otherPin.vx += targetVx * 0.5; // Reduced transfer
              otherPin.vy += targetVy * 0.5;
              pin.vx -= targetVx * 0.5;
              pin.vy -= targetVy * 0.5;

              // Transfer rotation
              const rotDiff = pin.rotationVel - otherPin.rotationVel;
              pin.rotationVel -= rotDiff * 0.2;
              otherPin.rotationVel += rotDiff * 0.2;

              // Separate pins slightly
              const overlap = (r1 + r2) - dist;
              const sepX = Math.cos(angle) * overlap * 0.51;
              const sepY = Math.sin(angle) * overlap * 0.51;
              pin.x -= sepX;
              pin.y -= sepY;
              otherPin.x += sepX;
              otherPin.y += sepY;
            }
          });
        }
      });

      if (!isRollingRef.current) {
        aimAngleRef.current = Math.sin(Date.now() / 500) * 0.5;
      }

      draw();
      animationFrameId = requestAnimationFrame(update);
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Lane
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(40, 0, 220, canvas.height);
      
      // Lane markings
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(40, i * 100);
        ctx.lineTo(260, i * 100);
        ctx.stroke();
      }

      // Pin Setter Arm
      if (isTriggeredRef.current) {
        ctx.fillStyle = '#ffcc00';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffcc00';
        ctx.fillRect(40, triggerY - 4, 220, 8);
        ctx.shadowBlur = 0;
        
        // Timer visual
        if (timerRef.current !== null) {
          ctx.fillStyle = 'rgba(255, 204, 0, 0.2)';
          ctx.fillRect(40, triggerY - 4, (timerRef.current / 3) * 220, 8);
        }
      }

      // Pins
      pins.current.forEach((pin) => {
        if (pin.y < 600) {
          ctx.save();
          ctx.translate(pin.x, pin.y);
          ctx.rotate(pin.rotation);
          
          if (pin.isKnocked) {
            ctx.globalAlpha = 0.7 + (pin.fallProgress * 0.3);
            ctx.fillStyle = 'white';
            
            const w = 12;
            const h = 24; // Full height when fallen
            const scale = pin.fallProgress;
            
            ctx.save();
            ctx.scale(1, scale);
            
            // Draw Pin Body (Side View)
            ctx.beginPath();
            // Head
            ctx.arc(0, -h * 0.35, w * 0.25, 0, Math.PI * 2);
            ctx.fill();
            
            // Neck, Belly and Base
            ctx.beginPath();
            ctx.moveTo(-w * 0.15, -h * 0.25);
            ctx.bezierCurveTo(-w * 0.15, -h * 0.1, -w * 0.45, 0, -w * 0.45, h * 0.2);
            ctx.bezierCurveTo(-w * 0.45, h * 0.35, -w * 0.35, h * 0.45, -w * 0.3, h * 0.5);
            ctx.lineTo(w * 0.3, h * 0.5);
            ctx.bezierCurveTo(w * 0.35, h * 0.45, w * 0.45, h * 0.35, w * 0.45, h * 0.2);
            ctx.bezierCurveTo(w * 0.45, 0, w * 0.15, -h * 0.1, w * 0.15, -h * 0.25);
            ctx.closePath();
            ctx.fill();
            
            // Red Stripes
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(-w * 0.2, -h * 0.2, w * 0.4, h * 0.04);
            ctx.fillRect(-w * 0.22, -h * 0.14, w * 0.44, h * 0.04);
            
            ctx.restore();
          } else {
            // Standing Pin (Top View)
            // Main body shadow/depth
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.arc(1, 1, 7, 0, Math.PI * 2);
            ctx.fill();
            
            // Main body
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(0, 0, 7, 0, Math.PI * 2);
            ctx.fill();
            
            // Head (Top view)
            ctx.fillStyle = '#f8f8f8';
            ctx.beginPath();
            ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Red ring
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.restore();
        }
      });


      // Ball
      if (isRollingRef.current || !isRollingRef.current) {
        const ballColor = '#ff4400';
        ctx.fillStyle = ballColor;
        ctx.shadowBlur = 15;
        ctx.shadowColor = ballColor;
        ctx.beginPath();
        ctx.arc(ballPos.current.x, ballPos.current.y, 10.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Aiming line & Trajectory Guide
      if (!isRollingRef.current) {
        // Basic aim line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(ballPos.current.x, ballPos.current.y);
        ctx.lineTo(
          ballPos.current.x + Math.sin(aimAngleRef.current) * 100,
          ballPos.current.y - Math.cos(aimAngleRef.current) * 100
        );
        ctx.stroke();
        ctx.setLineDash([]);

        // Trajectory guide when charging
        const ballNumber = currentPlayer.scores.length + 1;
        if (isChargingRef.current && ballNumber < 3) {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 2;
          let tempX = ballPos.current.x;
          let tempY = ballPos.current.y;
          const speed = 2 + (powerRef.current / 100) * 4;
          let tempVx = Math.sin(aimAngleRef.current) * speed;
          let tempVy = -Math.cos(aimAngleRef.current) * speed;
          let tempGutter = false;

          ctx.moveTo(tempX, tempY);
          // Predict until just beyond the head pin or halfway depending on ball number
          const stopY = ballNumber === 1 ? 100 : 240; // 240 is halfway between 360 and 120

          for (let i = 0; i < 200; i++) {
            if (!tempGutter && (tempX < 40 || tempX > 260)) {
              tempGutter = true;
              tempVx = 0;
            }
            if (!tempGutter) {
              tempVx += spinRef.current * 0.075;
            }
            tempX += tempVx;
            tempY += tempVy;
            ctx.lineTo(tempX, tempY);
            
            // Stop based on ball number
            if (tempY < stopY || tempX < 0 || tempX > 300) break;
          }
          ctx.stroke();
          ctx.lineWidth = 1; // Reset
        }
      }
    };

    update();
    return () => cancelAnimationFrame(animationFrameId);
  }, [currentPlayer, onBowl]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAiming && !isRolling) {
      isChargingRef.current = true;
      powerRef.current = 0;
      spinRef.current = 0;
      setPower(0);
      setSpin(0);
      chargeStartPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isChargingRef.current) {
      const dx = e.clientX - chargeStartPos.current.x;
      const dy = e.clientY - chargeStartPos.current.y; // Down is positive power (pull back)
      
      const newSpin = Math.max(-1, Math.min(1, dx / 100));
      const newPower = Math.max(0, Math.min(100, dy / 2));
      
      spinRef.current = newSpin;
      powerRef.current = newPower;
      setSpin(newSpin);
      setPower(newPower);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAiming && !isRolling) {
      isChargingRef.current = true;
      powerRef.current = 0;
      spinRef.current = 0;
      setPower(0);
      setSpin(0);
      chargeStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isChargingRef.current) {
      const dx = e.touches[0].clientX - chargeStartPos.current.x;
      const dy = e.touches[0].clientY - chargeStartPos.current.y; // Down is positive power (pull back)
      
      const newSpin = Math.max(-1, Math.min(1, dx / 100));
      const newPower = Math.max(0, Math.min(100, dy / 2));
      
      spinRef.current = newSpin;
      powerRef.current = newPower;
      setSpin(newSpin);
      setPower(newPower);
    }
  };

  const handleMouseUp = () => {
    if (isChargingRef.current) {
      isChargingRef.current = false;
      setIsAiming(false);
      isRollingRef.current = true;
      setIsRolling(true);
      const speed = 2 + (powerRef.current / 100) * 4;
      ballVel.current = {
        x: Math.sin(aimAngleRef.current) * speed,
        y: -Math.cos(aimAngleRef.current) * speed,
      };
      ballSpin.current = spinRef.current;
      setPower(0);
      setSpin(0);
    }
  };

  return (
    <div className="relative flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={300}
        height={510}
        className="bg-black rounded-lg shadow-2xl border border-white/10 cursor-crosshair touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      />
      
      {/* HUD Overlay */}
      <div className="absolute top-20 left-0 right-0 flex justify-between px-8 pointer-events-none">
        <div className="flex flex-col gap-1">
          <div className="text-[10px] font-mono text-white/40 uppercase">Power</div>
          <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-orange-500 transition-all duration-75"
              style={{ width: `${power}%` }}
            />
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="text-[10px] font-mono text-white/40 uppercase">Spin</div>
          <div className="w-24 h-1.5 bg-white/10 rounded-full relative overflow-hidden">
            <div 
              className={`absolute top-0 bottom-0 ${spin > 0 ? 'bg-blue-500 left-1/2' : 'bg-red-500 right-1/2'}`}
              style={{ width: `${Math.abs(spin) * 50}%` }}
            />
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/40 -translate-x-1/2" />
          </div>
        </div>
      </div>

    </div>
  );
};

export default BowlingCanvas;
