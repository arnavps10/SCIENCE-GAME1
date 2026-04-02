/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Info, 
  Play, 
  RotateCcw, 
  Heart, 
  Droplets, 
  Zap,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Trophy,
  Beer,
  Skull,
  Dna,
  CircleDot,
  ShoppingCart,
  ShieldCheck,
  Clock,
  PlusCircle,
  ZapOff,
  Wind,
  Shield,
  Zap as ZapIcon,
  Flame,
  ArrowLeft,
  ArrowRight,
  Menu,
  X,
  Mail,
  Lock,
  User,
  EyeOff,
  Ghost,
  Zap as SabotageIcon,
} from 'lucide-react';
import { auth, db, signIn, saveHighScore, getLeaderboard, sendSabotage } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc, query, where, orderBy, limit, onSnapshot, deleteDoc, getDocs } from 'firebase/firestore';

// --- Audio Service (Synthesized) ---

const playSound = (type: 'CLICK' | 'MISS' | 'POWERUP' | 'WIN' | 'BOSS_HIT' | 'COMBO' | 'LEVEL_UP' | 'MUTATION' | EntityType) => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'ALCOHOL':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'TOXIN_HEAVY':
      case 'TOXIN_PESTICIDE':
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      case 'VIRUS':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'CANCER':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      case 'FAT':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      case 'HEALTH_BOOST':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case 'EASTER_EGG':
        osc.type = 'sine';
        [440, 554.37, 659.25, 880].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.setValueAtTime(f, now + (i * 0.05));
          g.gain.setValueAtTime(0.1, now + (i * 0.05));
          g.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.05) + 0.1);
          o.start(now + (i * 0.05));
          o.stop(now + (i * 0.05) + 0.1);
        });
        break;
      case 'CLICK':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440 + (Math.random() * 100), now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'MISS':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case 'POWERUP':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.4);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      case 'BOSS_HIT':
        osc.type = 'square';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      case 'COMBO':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600 + (Math.random() * 400), now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'LEVEL_UP':
        osc.type = 'sine';
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.setValueAtTime(freq, now + (i * 0.1));
          g.gain.setValueAtTime(0.1, now + (i * 0.1));
          g.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.1) + 0.2);
          o.start(now + (i * 0.1));
          o.stop(now + (i * 0.1) + 0.2);
        });
        break;
      case 'MUTATION':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(400, now + 0.5);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;
    }
  } catch (e) {}
};

// --- Custom Liver Icon ---

const LiverIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12,2C15.5,2 19,4 21,7C22.5,9.5 22.5,13 21,16C19,19 15.5,21 12,21C8.5,21 5,19 3,16C1.5,13 1.5,9.5 3,7C5,4 8.5,2 12,2M12,4C9.5,4 7,5.5 5.5,7.5C4.5,9 4.5,11.5 5.5,13.5C7,15.5 9.5,17 12,17C14.5,17 17,15.5 18.5,13.5C19.5,11.5 19.5,9 18.5,7.5C17,5.5 14.5,4 12,4Z" opacity="0.3" />
    <path d="M12,3C16,3 20,5 22,9C23.5,12 23.5,16 22,19C20,22 16,24 12,24C8,24 4,22 2,19C0.5,16 0.5,12 2,9C4,5 8,3 12,3M12,5C9,5 6,6.5 4.5,9.5C3.5,11.5 3.5,14.5 4.5,16.5C6,19.5 9,21 12,21C15,21 18,19.5 19.5,16.5C20.5,14.5 20.5,11.5 19.5,9.5C18,6.5 15,5 12,5Z" />
    <path d="M14,10C14,11.1 13.1,12 12,12C10.9,12 10,11.1 10,10C10,8.9 10.9,8 12,8C13.1,8 14,8.9 14,10Z" />
  </svg>
);

// --- Types ---

// --- Constants & Types ---

const STUDENTS = [
  { name: "Arnav Sharma", password: "Arnav2026!" },
  { name: "Vilohith Adusumalli", password: "Vilohith2026!" },
  { name: "Arya Anand", password: "Arya2026!" },
  { name: "Jaden Nicole Aquino", password: "Jaden2026!" },
  { name: "Kamalesh Aravind Kumar", password: "Kamalesh2026!" },
  { name: "Zeenat Ashrafi", password: "Zeenat2026!" },
  { name: "Aadwin Balla", password: "Aadwin2026!" },
  { name: "Viraj Bharti", password: "Viraj2026!" },
  { name: "Yehudit Chang", password: "Yehudit2026!" },
  { name: "Arin Datta", password: "Arin2026!" },
  { name: "Julian Escobedo", password: "Julian2026!" },
  { name: "Justin Gu", password: "Justin2026!" },
  { name: "Coral Huang", password: "Coral2026!" },
  { name: "Vikhyat Jain", password: "Vikhyat2026!" },
  { name: "Skandan Karthikeyan", password: "Skandan2026!" },
  { name: "Kristie Kwan", password: "Kristie2026!" },
  { name: "Emma Lantz", password: "Emma2026!" },
  { name: "Natalie Leete", password: "Natalie2026!" },
  { name: "Joanna Liu", password: "Joanna2026!" },
  { name: "Gaurav Nallapeta", password: "Gaurav2026!" },
  { name: "Alice Ng", password: "Alice2026!" },
  { name: "Tanya Pandey", password: "Tanya2026!" },
  { name: "Ronit Parikh", password: "Ronit2026!" },
  { name: "Raymon Pearl", password: "Raymon2026!" },
  { name: "Roshell Elise Pena", password: "Roshell2026!" },
  { name: "Kshitij Rajmohan", password: "Kshitij2026!" },
  { name: "Anna Rufova", password: "Anna2026!" },
  { name: "Saahib Sethi", password: "Saahib2026!" },
  { name: "Aadrit Sharma", password: "Aadrit2026!" },
  { name: "Unnati Siledar", password: "Unnati2026!" },
  { name: "Olena Trushel", password: "Olena2026!" },
  { name: "Marwa Wafa", password: "Marwa2026!" },
  { name: "Huibo Yang", password: "Huibo2026!" },
  { name: "Michael Zhao", password: "Michael2026!" }
];

type GameState = 'LOGIN' | 'START' | 'DIFFICULTY' | 'PLAYING' | 'BOSS_INTRO' | 'LEVEL_TRANSITION' | 'LEVEL_COMPLETE' | 'GAME_OVER' | 'GAME_FINISHED' | 'SHOP' | 'LEADERBOARD' | 'TUTORIAL' | 'INFO';
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

type EntityType = 'ALCOHOL' | 'TOXIN_HEAVY' | 'TOXIN_PESTICIDE' | 'VIRUS' | 'FAT' | 'CANCER' | 'HEALTH_BOOST' | 'TIME_DILATION' | 'DETOX_BLAST' | 'IMMUNITY' | 'SCORE_FRENZY' | 'BOSS' | 'EASTER_EGG' | 'LAVA_BALL';

interface EasterEggData {
  message: string;
  powerup: string;
  isRare?: boolean;
}

interface Entity {
  id: number;
  x: number;
  y: number;
  type: EntityType;
  size: number;
  speed: number;
  health: number;
  rotation: number;
  maxHealth: number;
  isMutated?: boolean;
  spawnTime: number;
  easterEggData?: EasterEggData;
  direction?: { x: number, y: number };
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: React.ReactNode;
  type?: string;
}

// --- Constants ---

const DIFFICULTY_CONFIG = {
  EASY: { speedMult: 1, spawnMult: 1, scoreMult: 1, healthSpawnChance: 0.08 },
  MEDIUM: { speedMult: 1.3, spawnMult: 1.3, scoreMult: 1.5, healthSpawnChance: 0.04 },
  HARD: { speedMult: 1.6, spawnMult: 1.6, scoreMult: 2, healthSpawnChance: 0.01 },
};

const LEVELS = [
  {
    id: 1,
    title: "Ethanol Overload",
    description: "Neutralize alcohol molecules before they cause oxidative stress.",
    info: "Alcohol is metabolized into acetaldehyde, a highly toxic substance and known carcinogen. Your liver works overtime to clear it.",
    baseTargetScore: 150,
    entityTypes: ['ALCOHOL', 'HEALTH_BOOST'] as EntityType[],
    baseSpawnRate: 1400,
    hasBoss: false,
  },
  {
    id: 2,
    title: "Chemical Siege",
    description: "Environmental toxins are flooding the system. Heavy metals and pesticides detected.",
    info: "The liver filters 1.4 liters of blood every minute. Pesticides and heavy metals can accumulate in liver cells, leading to chronic damage.",
    baseTargetScore: 300,
    entityTypes: ['ALCOHOL', 'TOXIN_HEAVY', 'TOXIN_PESTICIDE', 'HEALTH_BOOST'] as EntityType[],
    baseSpawnRate: 1200,
    hasBoss: false,
  },
  {
    id: 3,
    title: "The Malignant Core",
    description: "A massive tumor has formed. Watch out for mutating cancer cells.",
    info: "Hepatocellular carcinoma (HCC) is the most common primary liver cancer. It often starts as a single tumor that grows rapidly.",
    baseTargetScore: 600,
    entityTypes: ['VIRUS', 'CANCER', 'TOXIN_HEAVY', 'HEALTH_BOOST'] as EntityType[],
    baseSpawnRate: 1000,
    hasBoss: true,
  }
];

const SHOP_ITEMS: ShopItem[] = [
  { id: 'HEALTH_KIT', name: 'Regen Kit', description: 'Instantly restore 25% health.', cost: 50, icon: <PlusCircle className="text-green-500" /> },
  { id: 'SHIELD', name: 'Membrane Shield', description: 'Next 3 misses don\'t damage health.', cost: 100, icon: <ShieldCheck className="text-blue-500" /> },
  { id: 'SLOW_MO', name: 'Time Dilation', description: 'Slow down entities for 10 seconds.', cost: 150, icon: <Clock className="text-purple-500" /> },
];

const EASTER_EGGS: EasterEggData[] = [
  { message: "Arin sucks", powerup: "ARIN_SLOW" },
  { message: "Arnav beat arin inthe shoe fight!!!", powerup: "SHOE_STRIKE" },
  { message: "Mrs.Penaverde is the best teacher!", powerup: "BEST_TEACHER" },
  { message: "DNAs are so fun", powerup: "DNA_FUN" },
  { message: "Kamalesh is the goat!!!", powerup: "GOAT_MODE" },
  { message: "Vilo needs a job!!", powerup: "VILO_JOB" },
  { message: "Mrs.Penaverde increase my grade please!!!", powerup: "GRADE_BOOST", isRare: true },
];

// --- Components ---

const EntityVisual = ({ type, health, maxHealth, isMutated }: { type: EntityType, health: number, maxHealth: number, isMutated?: boolean }) => {
  const isBoss = type === 'BOSS';
  
  const renderIcon = () => {
    switch (type) {
      case 'ALCOHOL': return <Beer className="w-2/3 h-2/3 text-amber-500" />;
      case 'TOXIN_HEAVY': return <Skull className="w-2/3 h-2/3 text-slate-600" />;
      case 'TOXIN_PESTICIDE': return <Droplets className="w-2/3 h-2/3 text-lime-600" />;
      case 'VIRUS': return <Activity className="w-2/3 h-2/3 text-green-500" />;
      case 'FAT': return <CircleDot className="w-2/3 h-2/3 text-yellow-400" />;
      case 'CANCER': return (
        <motion.div
          animate={isMutated ? { scale: [1, 1.2, 1], filter: ["hue-rotate(0deg)", "hue-rotate(90deg)", "hue-rotate(0deg)"] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="w-full h-full flex items-center justify-center"
        >
          <Dna className={`w-2/3 h-2/3 ${isMutated ? 'text-red-600' : 'text-indigo-600'}`} />
        </motion.div>
      );
      case 'HEALTH_BOOST': return <Heart className="w-2/3 h-2/3 text-green-400 fill-green-400" />;
      case 'TIME_DILATION': return <Zap className="w-2/3 h-2/3 text-blue-400 fill-blue-400" />;
      case 'DETOX_BLAST': return <Wind className="w-2/3 h-2/3 text-purple-400" />;
      case 'IMMUNITY': return <Shield className="w-2/3 h-2/3 text-yellow-400 fill-yellow-400" />;
      case 'SCORE_FRENZY': return <Flame className="w-2/3 h-2/3 text-orange-500 fill-orange-500" />;
      case 'EASTER_EGG': return (
        <motion.div
          animate={{ 
            rotate: [0, 5, -5, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="w-full h-full flex items-center justify-center bg-white border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <Mail className="w-2/3 h-2/3 text-red-500" />
        </motion.div>
      );
      case 'LAVA_BALL': return (
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 360]
          }}
          transition={{ duration: 1, repeat: Infinity }}
          className="w-full h-full rounded-full bg-gradient-to-br from-orange-600 via-red-600 to-yellow-500 border-4 border-slate-900 shadow-[0_0_20px_rgba(239,68,68,0.6)] flex items-center justify-center"
        >
          <Flame className="text-white w-1/2 h-1/2" />
        </motion.div>
      );
      case 'BOSS': return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          <motion.div 
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Skull className="w-3/4 h-3/4 text-white opacity-20" />
          </motion.div>
          
          {/* Core Pulsing */}
          <motion.div 
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute w-1/2 h-1/2 rounded-full bg-red-600 blur-xl z-0"
          />

          <AlertCircle className="w-1/2 h-1/2 text-white z-10" />
          
          {/* Rotating Rings */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-2 border-4 border-dashed border-red-400/40 rounded-full"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-6 border-2 border-dotted border-orange-400/30 rounded-full"
          />
          
          {/* Orbiting Particles */}
          {[0, 120, 240].map((angle, i) => (
            <motion.div
              key={i}
              animate={{ 
                rotate: 360,
              }}
              transition={{ duration: 3 + i, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0"
            >
              <div 
                className="w-4 h-4 bg-red-500 rounded-full absolute"
                style={{ 
                  top: '10%', 
                  left: '50%', 
                  transform: `translateX(-50%) rotate(${angle}deg)`,
                  transformOrigin: 'center 100px'
                }}
              />
            </motion.div>
          ))}
        </div>
      );
      default: return <AlertCircle />;
    }
  };

  return (
    <div className={`w-full h-full flex flex-col items-center justify-center relative transition-all duration-500 ${isBoss ? 'bg-slate-900 border-[12px] border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.5)]' : isMutated ? 'bg-red-50 border-4 border-red-600 scale-110' : 'bg-white border-4 border-slate-900'}`}>
      {renderIcon()}
      {maxHealth > 1 && (
        <div className="absolute -bottom-6 left-0 w-full h-3 bg-slate-200 border-2 border-slate-900">
          <div 
            className={`h-full transition-all duration-200 ${isBoss ? 'bg-gradient-to-r from-red-600 to-orange-500' : isMutated ? 'bg-red-600' : 'bg-red-500'}`} 
            style={{ width: `${(health / maxHealth) * 100}%` }} 
          />
        </div>
      )}
      {isBoss && <div className="absolute -top-12 font-black uppercase text-red-600 tracking-[0.2em] text-2xl animate-pulse drop-shadow-lg">CORE THREAT</div>}
      {isMutated && <div className="absolute -top-6 text-[10px] font-black text-red-600 uppercase bg-white px-1 border border-red-600">MUTATED</div>}
    </div>
  );
};

const VisualHealthBar = ({ health }: { health: number }) => {
  const segments = 10;
  const activeSegments = Math.ceil(health / (100 / segments));
  
  return (
    <motion.div 
      animate={health < 30 ? { x: [-2, 2, -2, 2, 0] } : {}}
      transition={{ repeat: Infinity, duration: 0.1 }}
      className="flex gap-1 h-8 w-48 border-4 border-slate-900 p-1 bg-white"
    >
      {Array.from({ length: segments }).map((_, i) => (
        <motion.div
          key={i}
          initial={false}
          animate={{ 
            backgroundColor: i < activeSegments 
              ? (health < 30 ? '#dc2626' : '#22c55e') 
              : '#f1f5f9',
            scaleY: i < activeSegments ? [1, 1.1, 1] : 1
          }}
          transition={{ duration: 0.3 }}
          className="flex-1"
        />
      ))}
    </motion.div>
  );
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('LOGIN');
  const [currentUser, setCurrentUser] = useState<{ id: string, name: string, highScore: number } | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isBlurry, setIsBlurry] = useState(false);
  const [isInverted, setIsInverted] = useState(false);
  const [isSpeedUp, setIsSpeedUp] = useState(false);
  const [isDarkness, setIsDarkness] = useState(false);
  const [isMirror, setIsMirror] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [sabotageCooldowns, setSabotageCooldowns] = useState<Record<string, number>>({});
  const [difficulty, setDifficulty] = useState<Difficulty>('EASY');
  const [levelIndex, setLevelIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [health, setHealth] = useState(100);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [combos, setCombos] = useState(0);
  const [shieldCount, setShieldCount] = useState(0);
  const [isSlowMo, setIsSlowMo] = useState(false);
  const [isImmune, setIsImmune] = useState(false);
  const [isScoreFrenzy, setIsScoreFrenzy] = useState(false);
  const [bossActive, setBossActive] = useState(false);
  const [bossAttacking, setBossAttacking] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [clickEffects, setClickEffects] = useState<{ id: number, x: number, y: number }[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [screenShake, setScreenShake] = useState(false);
  const [leaderboard, setLeaderboard] = useState<{ name: string, score: number }[]>([]);
  const [activeEasterEgg, setActiveEasterEgg] = useState<EasterEggData | null>(null);
  const [gradeBoostActive, setGradeBoostActive] = useState(false);
  const [bestTeacherActive, setBestTeacherActive] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const currentLevel = LEVELS[levelIndex];
  const config = DIFFICULTY_CONFIG[difficulty];

  const targetScore = Math.floor(currentLevel.baseTargetScore * config.scoreMult);
  const spawnRate = currentLevel.baseSpawnRate / config.spawnMult;

  // --- Persistence ---

  useEffect(() => {
    const savedPoints = localStorage.getItem('hepatohero_points');
    const savedLevel = localStorage.getItem('hepatohero_level');
    const savedLeaderboard = localStorage.getItem('hepatohero_leaderboard');
    
    if (savedPoints) setTotalPoints(parseInt(savedPoints));
    if (savedLevel) setLevelIndex(parseInt(savedLevel));
    if (savedLeaderboard) setLeaderboard(JSON.parse(savedLeaderboard));
  }, []);

  useEffect(() => {
    localStorage.setItem('hepatohero_points', totalPoints.toString());
    localStorage.setItem('hepatohero_level', levelIndex.toString());
  }, [totalPoints, levelIndex]);

  const updateLeaderboard = (finalScore: number) => {
    const name = prompt("Enter your name for the leaderboard:") || "Anonymous";
    const newEntry = { name, score: finalScore };
    const updated = [...leaderboard, newEntry].sort((a, b) => b.score - a.score).slice(0, 10);
    setLeaderboard(updated);
    localStorage.setItem('hepatohero_leaderboard', JSON.stringify(updated));
  };

  // --- Game Logic ---

  // --- Firebase Auth & Sabotage Listeners ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUser({ id: user.uid, name: userData.name, highScore: userData.highScore || 0 });
          setGameState('START');
        }
      } else {
        setGameState('LOGIN');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const path = 'sabotages';
    const q = query(collection(db, path), where('targetName', '==', currentUser.name), orderBy('timestamp', 'desc'), limit(1));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const sabotage = snapshot.docs[0].data();
        const sabotageTime = new Date(sabotage.timestamp).getTime();
        if (Date.now() - sabotageTime < 10000) {
          if (sabotage.type === 'BLUR') {
            setIsBlurry(true);
            setTimeout(() => setIsBlurry(false), sabotage.duration);
          } else if (sabotage.type === 'INVERT') {
            setIsInverted(true);
            setTimeout(() => setIsInverted(false), sabotage.duration);
          } else if (sabotage.type === 'SPEED_UP') {
            setIsSpeedUp(true);
            setTimeout(() => setIsSpeedUp(false), sabotage.duration);
          } else if (sabotage.type === 'SHAKE') {
            setScreenShake(true);
            setTimeout(() => setScreenShake(false), sabotage.duration);
          } else if (sabotage.type === 'DARKNESS') {
            setIsDarkness(true);
            setTimeout(() => setIsDarkness(false), sabotage.duration);
          } else if (sabotage.type === 'MIRROR') {
            setIsMirror(true);
            setTimeout(() => setIsMirror(false), sabotage.duration);
          } else if (sabotage.type === 'FREEZE') {
            setIsFrozen(true);
            setTimeout(() => setIsFrozen(false), sabotage.duration);
          } else if (sabotage.type === 'SPIN') {
            setIsSpinning(true);
            setTimeout(() => setIsSpinning(false), sabotage.duration);
          }
          playSound('MUTATION');
          addFloatingText(window.innerWidth / 2, window.innerHeight / 2, `SABOTAGE: ${sabotage.type}!`, "text-red-600");
          deleteDoc(doc(db, 'sabotages', snapshot.docs[0].id)).catch(console.error);
        }
      }
    }, (error) => {
      console.error(error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (gameState === 'LEADERBOARD') {
      const unsubscribe = getLeaderboard(setLeaderboard);
      return () => unsubscribe();
    }
  }, [gameState]);

  const handleLogin = async (name: string, pass: string) => {
    const trimmedName = name.trim();
    const trimmedPass = pass.trim();
    
    const student = STUDENTS.find(s => s.name.toLowerCase() === trimmedName.toLowerCase() && s.password === trimmedPass);
    if (!student) {
      setLoginError('Invalid name or password. Please check with your teacher.');
      return;
    }

    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const email = `${trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '')}@hepatohero.com`;
      const { user, error } = await signIn(email, trimmedPass);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { name: student.name, password: student.password }, { merge: true });
        setCurrentUser({ id: user.uid, name: student.name, highScore: 0 });
        setGameState('START');
      } else {
        if (error === 'auth/operation-not-allowed') {
          setLoginError('Email/Password Auth is disabled. Please enable it in your Firebase Console -> Authentication -> Sign-in method.');
        } else {
          setLoginError(`Authentication failed: ${error}`);
        }
      }
    } catch (error) {
      console.error('Login Error:', error);
      setLoginError('Connection error. Please check your network.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const spawnEntity = useCallback(() => {
    if (!gameAreaRef.current || bossActive) return;
    
    const rect = gameAreaRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Smart Health Boost Logic
    let healthSpawnChance = 0;
    if (health < 30) healthSpawnChance = 0.15; // 15% chance if critical
    else if (health < 70) healthSpawnChance = 0.05; // 5% chance if damaged
    
    // Check how many health boosts are already on screen to prevent flooding
    const existingHealthBoosts = entities.filter(e => e.type === 'HEALTH_BOOST').length;
    if (existingHealthBoosts >= 2) healthSpawnChance = 0; // Max 2 at a time

    const isHealthBoost = Math.random() < healthSpawnChance;
    
    // Rare chance for other powerups
    const isSpecialPowerup = !isHealthBoost && Math.random() < 0.03;
    const powerupTypes: EntityType[] = ['TIME_DILATION', 'DETOX_BLAST', 'IMMUNITY', 'SCORE_FRENZY'];
    const specialType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];

    // Easter Egg Spawn Logic
    const isEasterEgg = Math.random() < 0.05; // 5% chance to spawn from side
    
    if (isEasterEgg) {
      const fromLeft = Math.random() < 0.5;
      const spawnX = fromLeft ? -100 : rect.width + 100;
      const spawnY = Math.random() * (rect.height - 100) + 50;
      const isRare = Math.random() < 0.1; // 10% chance for rare grade boost
      const eggData = isRare ? EASTER_EGGS[EASTER_EGGS.length - 1] : EASTER_EGGS[Math.floor(Math.random() * (EASTER_EGGS.length - 1))];

      const newEgg: Entity = {
        id: Date.now() + Math.random(),
        x: spawnX,
        y: spawnY,
        type: 'EASTER_EGG',
        size: 80,
        speed: 2,
        health: 1,
        maxHealth: 1,
        rotation: 0,
        spawnTime: Date.now(),
        easterEggData: eggData,
        direction: { x: fromLeft ? 1 : -1, y: (Math.random() - 0.5) * 0.5 }
      };
      setEntities(prev => [...prev, newEgg]);
      return;
    }

    const type = isHealthBoost ? 'HEALTH_BOOST' : (isSpecialPowerup ? specialType : currentLevel.entityTypes[Math.floor(Math.random() * currentLevel.entityTypes.length)]);
    
    const newEntity: Entity = {
      id: Date.now() + Math.random(),
      x: Math.random() * (rect.width - 80),
      y: -100,
      type,
      size: type === 'CANCER' ? 70 : 60,
      speed: (isSlowMo ? 0.5 : (1.5 + Math.random() * 2 + (levelIndex * 0.4))) * config.speedMult,
      health: type === 'CANCER' ? 3 : 1,
      maxHealth: type === 'CANCER' ? 3 : 1,
      rotation: Math.random() * 360,
      spawnTime: Date.now(),
    };

    setEntities(prev => [...prev, newEntity]);
  }, [currentLevel, levelIndex, config, isSlowMo, bossActive, health]);

  const spawnBoss = useCallback(() => {
    if (!gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    
    const boss: Entity = {
      id: 999,
      x: rect.width / 2 - 100,
      y: 100,
      type: 'BOSS',
      size: 200,
      speed: 0,
      health: 60 * config.scoreMult,
      maxHealth: 60 * config.scoreMult,
      rotation: 0,
      spawnTime: Date.now(),
    };
    setEntities([boss]);
    setBossActive(true);
  }, [config.scoreMult]);

  const startGame = (diff: Difficulty) => {
    setDifficulty(diff);
    setGameState('PLAYING');
    setScore(0);
    setHealth(100);
    setEntities([]);
    setCombos(0);
    setBossActive(false);
  };

  const startBossDev = () => {
    setDifficulty('HARD');
    setLevelIndex(2);
    setGameState('PLAYING');
    setScore(0);
    setHealth(100);
    setEntities([]);
    setCombos(0);
    setTimeout(() => spawnBoss(), 500);
  };

  const nextLevel = () => {
    if (levelIndex < LEVELS.length - 1) {
      setLevelIndex(prev => prev + 1);
      setGameState('LEVEL_TRANSITION');
      setScore(0);
      setEntities([]);
      setBossActive(false);
      playSound('LEVEL_UP');
    } else {
      setGameState('START');
      setLevelIndex(0);
    }
  };

  const addFloatingText = (x: number, y: number, text: string, color: string) => {
    const id = Date.now() + Math.random();
    setFloatingTexts(prev => [...prev, { id, x, y, text, color }]);
    setTimeout(() => setFloatingTexts(prev => prev.filter(t => t.id !== id)), 1000);
  };

  const triggerScreenShake = () => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 200);
  };

  const handleEntityClick = (id: number, type: EntityType, x: number, y: number) => {
    // Add click feedback
    const effectId = Date.now();
    setClickEffects(prev => [...prev, { id: effectId, x, y }]);
    setTimeout(() => setClickEffects(prev => prev.filter(e => e.id !== effectId)), 500);

    if (type === 'BOSS') {
      playSound('BOSS_HIT');
      triggerScreenShake();
      setEntities(prev => prev.map(e => {
        if (e.id === id) {
          const newHealth = e.health - 1;
          addFloatingText(x, y, "-1 HP", "text-red-600");
          // Boss counter-attack or minion spawn
          if (newHealth > 0 && newHealth % 3 === 0) {
            setBossAttacking(true);
            setTimeout(() => setBossAttacking(false), 500);
            setTimeout(() => {
              const attackType = Math.random() > 0.5 ? 'CANCER' : (Math.random() > 0.5 ? 'TOXIN' : 'ALCOHOL');
              setEntities(curr => [...curr, {
                id: Math.random(),
                x: e.x + (Math.random() * 150 - 75),
                y: e.y + (Math.random() * 100 - 50),
                type: attackType,
                size: attackType === 'CANCER' ? 40 : 50,
                speed: attackType === 'CANCER' ? 4 : 5,
                health: 1,
                maxHealth: 1,
                rotation: 0,
                spawnTime: Date.now(),
                isMutated: attackType === 'CANCER'
              }]);
            }, 100);
          }
          return { ...e, health: newHealth };
        }
        return e;
      }));
      
      const boss = entities.find(e => e.id === id);
      if (boss && boss.health <= 1) {
        setScore(s => s + 10);
        setTotalPoints(p => p + 100);
        if (currentUser) {
          saveHighScore(currentUser.id, currentUser.name, score + 10);
        }
        if (levelIndex === LEVELS.length - 1) {
          setGameState('GAME_FINISHED');
        } else {
          setGameState('LEVEL_COMPLETE');
        }
        playSound('WIN');
      }
      return;
    }

    if (type === 'HEALTH_BOOST') {
      playSound('POWERUP');
      setHealth(h => Math.min(100, h + 15));
      addFloatingText(x, y, "+15 HP", "text-green-600");
    } else if (type === 'TIME_DILATION') {
      playSound('POWERUP');
      setEntities(prev => prev.map(e => ({ ...e, speed: e.speed * 0.5 })));
      addFloatingText(x, y, "TIME SLOW", "text-blue-600");
    } else if (type === 'DETOX_BLAST') {
      playSound('POWERUP');
      setEntities(prev => prev.filter(e => e.type === 'BOSS' || e.type === 'HEALTH_BOOST'));
      setScore(s => s + 50);
      addFloatingText(x, y, "DETOX BLAST!", "text-purple-600");
    } else if (type === 'IMMUNITY') {
      playSound('POWERUP');
      setIsImmune(true);
      setTimeout(() => setIsImmune(false), 8000);
      addFloatingText(x, y, "IMMUNITY!", "text-yellow-600");
    } else if (type === 'SCORE_FRENZY') {
      playSound('POWERUP');
      setIsScoreFrenzy(true);
      setTimeout(() => setIsScoreFrenzy(false), 8000);
      addFloatingText(x, y, "SCORE FRENZY!", "text-orange-600");
    } else if (type === 'LAVA_BALL') {
      playSound('CLICK');
      setEntities(prev => prev.filter(e => e.id !== id));
      setScore(s => s + 5);
      addFloatingText(x, y, "NEUTRALIZED", "text-orange-600");
    } else if (type === 'EASTER_EGG') {
      const egg = entities.find(e => e.id === id);
      if (egg && egg.easterEggData) {
        playSound('POWERUP');
        setActiveEasterEgg(egg.easterEggData);
        
        // Apply Powerup
        const pType = egg.easterEggData.powerup;
        if (pType === 'ARIN_SLOW') {
          setIsSlowMo(true);
          setTimeout(() => setIsSlowMo(false), 20000); // 20s slow mo
        } else if (pType === 'SHOE_STRIKE') {
          setEntities(prev => prev.filter(e => e.type === 'BOSS' || e.type === 'EASTER_EGG'));
          setScore(s => s + 500); // 500 score
        } else if (pType === 'BEST_TEACHER') {
          setBestTeacherActive(true);
          setTimeout(() => setBestTeacherActive(false), 20000); // 20s 10x score
        } else if (pType === 'DNA_FUN') {
          setHealth(100);
          setShieldCount(s => s + 20); // 20 shields
        } else if (pType === 'GOAT_MODE') {
          setIsImmune(true);
          setIsScoreFrenzy(true);
          setTimeout(() => {
            setIsImmune(false);
            setIsScoreFrenzy(false);
          }, 20000); // 20s
        } else if (pType === 'VILO_JOB') {
          setTotalPoints(p => p + 2500); // 2500 points
          setScore(s => s + 2500);
        } else if (pType === 'GRADE_BOOST') {
          setGradeBoostActive(true);
          setIsImmune(true);
          setIsScoreFrenzy(true);
          setIsSlowMo(true);
          setHealth(100);
          setTimeout(() => {
            setGradeBoostActive(false);
            setIsImmune(false);
            setIsScoreFrenzy(false);
            setIsSlowMo(false);
          }, 30000); // 30s
        }

        setTimeout(() => setActiveEasterEgg(null), 4000);
      }
    } else {
      playSound(type);
      const comboBonus = Math.floor(combos / 5);
      const basePoints = 10 * config.scoreMult;
      const points = Math.floor(basePoints * (1 + comboBonus) * (isScoreFrenzy ? 2 : 1) * (bestTeacherActive ? 10 : 1));
      setScore(s => s + points);
      setTotalPoints(p => p + points);
      setCombos(c => c + 1);
      addFloatingText(x, y, `+${points}`, "text-slate-900");
      if (combos > 0 && (combos + 1) % 5 === 0) playSound('COMBO');
    }

    setEntities(prev => {
      const entity = prev.find(e => e.id === id);
      if (entity && entity.health > 1) {
        return prev.map(e => e.id === id ? { ...e, health: e.health - 1 } : e);
      }
      return prev.filter(e => e.id !== id);
    });
  };

  const SABOTAGE_ITEMS = [
    { id: 'SABOTAGE_BLUR', name: 'Vision Blur', cost: 150, icon: <EyeOff className="text-slate-400" />, description: 'Blur the screen of a random classmate.', type: 'BLUR' },
    { id: 'SABOTAGE_INVERT', name: 'Color Invert', cost: 200, icon: <Ghost className="text-red-400" />, description: 'Invert the colors of a random classmate.', type: 'INVERT' },
    { id: 'SABOTAGE_SPEED', name: 'Toxin Surge', cost: 250, icon: <SabotageIcon className="text-yellow-400" />, description: 'Speed up toxins for a random classmate.', type: 'SPEED_UP' },
    { id: 'SABOTAGE_SHAKE', name: 'Earthquake', cost: 200, icon: <Zap className="text-orange-500" />, description: 'Shake a random player\'s screen.', type: 'SHAKE' },
    { id: 'SABOTAGE_DARKNESS', name: 'Lights Out', cost: 200, icon: <EyeOff className="text-slate-800" />, description: 'Reduce a random player\'s visibility.', type: 'DARKNESS' },
    { id: 'SABOTAGE_MIRROR', name: 'Mirror Mode', cost: 200, icon: <Zap className="text-blue-400" />, description: 'Mirror a random player\'s screen.', type: 'MIRROR' },
    { id: 'SABOTAGE_FREEZE', name: 'Deep Freeze', cost: 250, icon: <Zap className="text-blue-200" />, description: 'Freeze a random player\'s game.', type: 'FREEZE' },
    { id: 'SABOTAGE_SPIN', name: 'Vertigo', cost: 250, icon: <Zap className="text-purple-500" />, description: 'Spin a random player\'s screen.', type: 'SPIN' },
  ];

  const buyItem = async (item: any) => {
    if (item.id.startsWith('SABOTAGE_') && sabotageCooldowns[item.id] && Date.now() < sabotageCooldowns[item.id]) {
      addFloatingText(window.innerWidth / 2, window.innerHeight / 2, "ON COOLDOWN!", "text-red-500");
      return;
    }

    if (totalPoints >= item.cost) {
      if (item.id.startsWith('SABOTAGE_')) {
        try {
          const usersSnapshot = await getDocs(collection(db, 'users'));
          const activeUsers = usersSnapshot.docs
            .map(d => d.data().name)
            .filter(name => name !== currentUser?.name);
            
          if (activeUsers.length === 0) {
            addFloatingText(window.innerWidth / 2, window.innerHeight / 2, "NO ACTIVE USERS TO SABOTAGE!", "text-red-500");
            return; // Do not deduct points
          }

          const target = activeUsers[Math.floor(Math.random() * activeUsers.length)];
          const duration = Math.floor(Math.random() * 15000) + 15000; // 15 to 30 seconds
          
          await sendSabotage(target, item.type, duration);
          addFloatingText(window.innerWidth / 2, window.innerHeight / 2, `SABOTAGE SENT TO ${target.toUpperCase()}!`, "text-red-600");
          
          // 60 second cooldown
          setSabotageCooldowns(prev => ({ ...prev, [item.id]: Date.now() + 60000 }));
        } catch (error) {
          console.error("Failed to send sabotage:", error);
          addFloatingText(window.innerWidth / 2, window.innerHeight / 2, "SABOTAGE FAILED!", "text-red-500");
          return;
        }
      }

      setTotalPoints(p => p - item.cost);
      playSound('POWERUP');
      
      if (item.id === 'HEALTH_KIT') {
        setHealth(h => {
          const newHealth = Math.min(100, h + 25);
          addFloatingText(window.innerWidth / 2, window.innerHeight / 2, `+${newHealth - h} HP`, "text-green-500");
          return newHealth;
        });
      }
      if (item.id === 'SHIELD') setShieldCount(s => s + 3);
      if (item.id === 'SLOW_MO') {
        setIsSlowMo(true);
        setTimeout(() => setIsSlowMo(false), 10000);
      }
    }
  };

  // --- Boss Toxin Spawner ---
  useEffect(() => {
    if (gameState !== 'PLAYING' || !bossActive || showExitConfirm) return;

    const interval = setInterval(() => {
      if (!gameAreaRef.current) return;
      const rect = gameAreaRef.current.getBoundingClientRect();
      
      const toxinTypes: EntityType[] = ['TOXIN_HEAVY', 'TOXIN_PESTICIDE', 'VIRUS', 'FAT'];
      const randomType = toxinTypes[Math.floor(Math.random() * toxinTypes.length)];

      const newToxin: Entity = {
        id: Date.now() + Math.random(),
        x: rect.width / 2 + (Math.random() * 200 - 100),
        y: 220,
        type: randomType,
        size: 50,
        speed: (3 + Math.random() * 4) * (isSpeedUp ? 1.5 : 1),
        health: 1,
        maxHealth: 1,
        rotation: Math.random() * 360,
        spawnTime: Date.now(),
      };
      setEntities(prev => [...prev, newToxin]);
      playSound('MUTATION');

      // Random Health Boost during boss fight
      if (Math.random() > 0.85) {
        const newHealthBoost: Entity = {
          id: Math.random(),
          x: Math.random() * (rect.width - 40),
          y: -40,
          type: 'HEALTH_BOOST',
          size: 40,
          speed: 3,
          health: 1,
          maxHealth: 1,
          rotation: 0,
          spawnTime: Date.now(),
        };
        setEntities(prev => [...prev, newHealthBoost]);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [gameState, bossActive]);

  // Game Loop
  useEffect(() => {
    if (gameState !== 'PLAYING' || isFrozen || showExitConfirm) return;

    const spawnInterval = setInterval(spawnEntity, spawnRate);
    
    const moveInterval = setInterval(() => {
      setEntities(prev => {
        const now = Date.now();
        const updated = prev.map(e => {
          let newSpeed = e.speed;
          let mutated = e.isMutated;
          let newX = e.x;
          let newY = e.y;
          
          if (e.type === 'EASTER_EGG' && e.direction) {
            newX += e.direction.x * e.speed;
            newY += e.direction.y * e.speed;
          } else {
            newY += e.speed;
          }

          // Cancer Mutation Logic
          if (e.type === 'CANCER' && !e.isMutated && (now - e.spawnTime > 3000)) {
            mutated = true;
            newSpeed = e.speed * 1.5;
            playSound('MUTATION');
          }

          return { ...e, x: newX, y: newY, isMutated: mutated, speed: newSpeed };
        });
        
        const missed = updated.filter(e => {
          const isOffBottom = e.y > (gameAreaRef.current?.clientHeight || 600);
          const isOffSides = e.type === 'EASTER_EGG' && (e.x < -200 || e.x > (gameAreaRef.current?.clientWidth || 800) + 200);
          return isOffBottom || isOffSides;
        });

        if (missed.length > 0) {
          missed.forEach(e => {
            if (e.type !== 'HEALTH_BOOST' && e.type !== 'BOSS' && e.type !== 'TIME_DILATION' && e.type !== 'DETOX_BLAST' && e.type !== 'IMMUNITY' && e.type !== 'SCORE_FRENZY' && e.type !== 'EASTER_EGG' && e.type !== 'LAVA_BALL') {
              if (shieldCount > 0) {
                setShieldCount(s => s - 1);
              } else if (!isImmune) {
                playSound('MISS');
                setHealth(h => {
                  const newHealth = Math.max(0, h - 10);
                  addFloatingText(e.x, e.y - 20, "-10 HP", "text-red-600");
                  return newHealth;
                });
                setCombos(0);
              }
            }
          });
        }
        
        return updated.filter(e => e.y <= (gameAreaRef.current?.clientHeight || 600));
      });
    }, 16);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(moveInterval);
    };
  }, [gameState, spawnEntity, spawnRate, shieldCount]);

  // Win/Loss Condition
  useEffect(() => {
    if (gameState === 'PLAYING') {
      if (health <= 0) {
        setGameState('GAME_OVER');
        updateLeaderboard(score);
      } else if (score >= targetScore && !bossActive) {
        if (currentLevel.hasBoss) {
          setGameState('BOSS_INTRO');
        } else {
          setGameState('LEVEL_COMPLETE');
        }
      }
    }
  }, [health, score, targetScore, gameState, bossActive, currentLevel.hasBoss]);

  // --- UI Sections ---

  const renderStartScreen = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center p-6 md:p-12 text-center max-w-2xl mx-auto flex-1 py-12"
    >
      <div className="mb-4">
        <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Welcome back, Guardian</span>
        <h2 className="text-2xl md:text-3xl font-black uppercase text-slate-900 tracking-tight">{currentUser?.name}</h2>
      </div>
      <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-slate-900 mb-4 uppercase leading-none">HepatoHero</h1>
      <p className="text-base md:text-xl text-slate-500 mb-8 md:mb-12 font-medium max-w-md">
        The liver is your body's primary shield. Spend points in the shop to upgrade your defenses.
      </p>
      
      <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
        <button 
          onClick={() => setGameState('TUTORIAL')}
          className="bg-slate-900 text-white px-8 py-4 rounded-none text-lg md:text-xl font-bold hover:bg-slate-800 transition-all uppercase tracking-widest neo-brutalist-shadow"
        >
          Start Tutorial
        </button>
        <button 
          onClick={() => setGameState('DIFFICULTY')}
          className="border-4 border-slate-900 text-slate-900 px-8 py-4 rounded-none text-lg md:text-xl font-bold hover:bg-slate-50 transition-all uppercase tracking-widest neo-brutalist-shadow"
        >
          Play Game
        </button>
        <button 
          onClick={() => setGameState('LEADERBOARD')}
          className="bg-yellow-400 text-slate-900 border-4 border-slate-900 px-8 py-4 rounded-none text-lg md:text-xl font-bold hover:bg-yellow-300 transition-all uppercase tracking-widest neo-brutalist-shadow flex items-center justify-center gap-2"
        >
          <Trophy className="w-6 h-6" /> Leaderboard
        </button>
        <button 
          onClick={() => setGameState('SHOP')}
          className="flex items-center justify-center gap-2 border-4 border-slate-900 text-slate-900 px-8 py-4 rounded-none text-lg md:text-xl font-bold hover:bg-slate-50 transition-all uppercase tracking-widest neo-brutalist-shadow"
        >
          <ShoppingCart /> Shop ({totalPoints})
        </button>
        
        <div className="flex gap-2 mt-4">
          <button 
            onClick={startBossDev}
            className="flex-1 py-2 bg-red-100 text-red-600 font-black uppercase text-[10px] border-2 border-red-600 hover:bg-red-200 transition-all"
          >
            Skip to Boss
          </button>
          <button 
            onClick={() => {
              // Trigger all easter eggs
              const messages = [
                "Arin sucks", "Arnav beat arin inthe shoe fight!!!", "Mrs.Penaverde is the best teacher!", 
                "DNAs are so fun", "Kamalesh is the goat!!!", "Vilo needs a job!!", 
                "Mrs.Penaverde increase my grade please!!!"
              ];
              messages.forEach((msg, i) => {
                setTimeout(() => {
                  const side = Math.random() > 0.5 ? 'left' : 'right';
                  const newEgg: Entity = {
                    id: Math.random(),
                    x: side === 'left' ? -100 : (gameAreaRef.current?.clientWidth || 800) + 100,
                    y: 100 + (i * 80),
                    type: 'EASTER_EGG',
                    size: 80,
                    speed: 2,
                    health: 1,
                    maxHealth: 1,
                    rotation: 0,
                    spawnTime: Date.now(),
                    direction: { x: side === 'left' ? 1 : -1, y: 0 },
                    easterEggData: {
                      message: msg,
                      powerup: msg.includes('grade') ? 'GRADE_BOOST' : 'SCORE_FRENZY'
                    }
                  };
                  setEntities(prev => [...prev, newEgg]);
                }, i * 500);
              });
              setGameState('PLAYING');
            }}
            className="flex-1 py-2 bg-yellow-100 text-yellow-600 font-black uppercase text-[10px] border-2 border-yellow-600 hover:bg-yellow-200 transition-all"
          >
            Easter Egg Dev
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderGameUI = () => (
    <div className={`relative w-full h-full flex flex-col bg-white transition-all duration-500 ${isBlurry ? 'blur-md' : ''} ${isInverted ? 'invert' : ''} ${isMirror ? '-scale-x-100' : ''}`}>
      {isDarkness && <div className="absolute inset-0 bg-black/80 pointer-events-none z-50 mix-blend-multiply" style={{ maskImage: 'radial-gradient(circle 150px at center, transparent, black)' }} />}
      {/* HUD */}
      <div className="flex justify-between items-center p-4 md:p-6 border-b-8 border-slate-900 z-10 bg-white relative">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 md:gap-3">
            <VisualHealthBar health={health} />
            <div className="flex gap-1">
              {shieldCount > 0 && <ShieldCheck className="text-blue-500 w-6 h-6 md:w-8 md:h-8" />}
              {isImmune && <Shield className="text-yellow-500 w-6 h-6 md:w-8 md:h-8 animate-pulse" />}
              {isScoreFrenzy && <Flame className="text-orange-500 w-6 h-6 md:w-8 md:h-8 animate-pulse" />}
              {isSlowMo && <Clock className="text-purple-500 w-6 h-6 md:w-8 md:h-8 animate-pulse" />}
              {gradeBoostActive && <Zap className="text-yellow-400 w-6 h-6 md:w-8 md:h-8 animate-pulse" />}
            </div>
          </div>
          {/* Multiplier Visualizer */}
          <div className="flex items-center gap-2">
            <div className="text-[10px] font-black uppercase text-slate-400">Multiplier</div>
            <div className="flex-1 h-2 bg-slate-100 w-24 md:w-32 border border-slate-900">
              <motion.div 
                animate={{ width: `${(combos % 5) * 20}%` }}
                className="h-full bg-slate-900"
              />
            </div>
            <div className="text-xs font-black">x{1 + Math.floor(combos / 5)}</div>
          </div>
        </div>
        
        {/* Combo Visualizer */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-6 z-30">
          <motion.div 
            animate={combos > 5 ? { scale: [1, 1.1, 1], rotate: [-2, 2, -2] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
            className={`px-6 py-2 border-4 border-slate-900 font-black text-xl md:text-2xl flex items-center gap-2 transition-all ${combos > 5 ? 'bg-slate-900 text-white shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]' : 'bg-white text-slate-900'}`}
          >
            <div className="flex items-center gap-2">
              <Flame className={`w-6 h-6 ${combos > 5 ? 'text-yellow-400 animate-pulse' : 'text-slate-400'}`} />
              <span className={combos > 5 ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-purple-500' : ''}>{combos}</span>
            </div>
            <div className="text-xs font-black">COMBO</div>
          </motion.div>
        </div>

        <div className="text-center hidden sm:block">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mission {levelIndex + 1}</span>
          <h2 className="text-lg md:text-xl font-black uppercase tracking-tighter">{currentLevel.title}</h2>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Points</span>
            </div>
            <span className="text-2xl md:text-3xl font-black tabular-nums">{score}</span>
          </div>
          <button 
            onClick={() => setShowExitConfirm(true)}
            className="p-2 border-4 border-slate-900 hover:bg-red-50 hover:text-red-600 transition-colors neo-brutalist-shadow"
            title="Exit Sector"
          >
            <X className="w-6 h-6 md:w-8 md:h-8" />
          </button>
        </div>
      </div>

      {/* Game Stage */}
      <motion.div 
        ref={gameAreaRef}
        animate={screenShake ? { x: [-5, 5, -5, 5, 0], y: [-5, 5, -5, 5, 0] } : {}}
        className="flex-1 relative overflow-hidden bg-slate-50 cursor-crosshair min-h-[500px] game-canvas"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setCombos(0);
            playSound('MISS');
          }
        }}
      >
        {/* Easter Egg Overlay */}
        <AnimatePresence>
        </AnimatePresence>

        {gradeBoostActive && (
          <motion.div 
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="absolute inset-0 bg-yellow-400 pointer-events-none z-0"
          />
        )}

        {isImmune && (
          <motion.div 
            animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.02, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 border-[30px] border-yellow-400/30 pointer-events-none z-10"
          />
        )}

        {isScoreFrenzy && (
          <motion.div 
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 0.3, repeat: Infinity }}
            className="absolute inset-0 bg-orange-500/10 pointer-events-none z-10"
          />
        )}

        {bossActive && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <motion.div 
              animate={{ opacity: bossAttacking ? [0.5, 0.8, 0.5] : [0.1, 0.2, 0.1] }}
              transition={{ duration: bossAttacking ? 0.2 : 3, repeat: Infinity }}
              className={`absolute inset-0 ${bossAttacking ? 'bg-red-600/40' : 'bg-red-900/20'}`}
            />
            {bossAttacking && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 1 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 border-[40px] border-red-600 rounded-full"
              />
            )}
            {/* Animated Lava Particles in background - Less prominent */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -100, x: Math.random() * 1000, opacity: 0 }}
                animate={{ 
                  y: 1000, 
                  opacity: [0, 0.4, 0],
                  scale: [0.5, 1.2, 0.5]
                }}
                transition={{ 
                  duration: 4 + Math.random() * 4, 
                  repeat: Infinity, 
                  delay: Math.random() * 8 
                }}
                className="absolute w-10 h-10 bg-gradient-to-t from-red-600/40 to-orange-400/40 rounded-full blur-2xl"
              />
            ))}
          </div>
        )}
        <AnimatePresence>
          {entities.map(entity => (
            <motion.div
              key={entity.id}
              initial={{ scale: 0, opacity: 0, rotate: entity.rotation - 45 }}
              animate={{ scale: 1, opacity: 1, rotate: entity.rotation }}
              exit={{ scale: 1.5, opacity: 0, transition: { duration: 0.1 } }}
              style={{ 
                position: 'absolute', 
                left: entity.x, 
                top: entity.y,
                width: entity.size,
                height: entity.size,
              }}
              onPointerDown={(e) => handleEntityClick(entity.id, entity.type, e.clientX, e.clientY)}
              className="cursor-pointer neo-brutalist-shadow"
            >
              <EntityVisual type={entity.type} health={entity.health} maxHealth={entity.maxHealth} isMutated={entity.isMutated} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Floating Texts */}
        <AnimatePresence>
          {floatingTexts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: -100 }}
              exit={{ opacity: 0 }}
              style={{ position: 'absolute', left: t.x, top: t.y }}
              className={`font-black text-2xl pointer-events-none z-50 ${t.color}`}
            >
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Click Feedback Effects */}
        <AnimatePresence>
          {clickEffects.map(effect => (
            <motion.div
              key={effect.id}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              style={{ 
                position: 'fixed', 
                left: effect.x - 20, 
                top: effect.y - 20,
                width: 40,
                height: 40,
                pointerEvents: 'none',
                zIndex: 100
              }}
            >
              <div className="w-full h-full border-4 border-slate-900 rounded-full flex items-center justify-center">
                <div className="w-1/2 h-1/2 bg-red-500/30 rounded-full" />
              </div>
              {/* Particle Burst */}
              {[0, 72, 144, 216, 288].map(angle => (
                <motion.div
                  key={angle}
                  initial={{ x: 0, y: 0, opacity: 1 }}
                  animate={{ 
                    x: Math.cos(angle * Math.PI / 180) * 40,
                    y: Math.sin(angle * Math.PI / 180) * 40,
                    opacity: 0 
                  }}
                  className="absolute top-1/2 left-1/2 w-2 h-2 bg-slate-900 rounded-full"
                />
              ))}
            </motion.div>
          ))}
        </AnimatePresence>

        {isSlowMo && (
          <motion.div 
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 border-[20px] border-purple-500/20 pointer-events-none flex items-center justify-center z-10"
          >
            <span className="text-purple-600 font-black text-4xl uppercase tracking-[1em] opacity-20">TIME DILATION ACTIVE</span>
          </motion.div>
        )}

        {combos > 2 && (
          <motion.div 
            key={combos}
            initial={{ scale: 0.5, opacity: 0, x: 50, rotate: -5 }}
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: 1, 
              x: 0, 
              rotate: combos > 10 ? [0, 2, -2, 0] : 0 
            }}
            transition={{ duration: 0.2 }}
            className={`absolute bottom-8 right-8 bg-slate-900 text-white px-6 py-3 font-black text-4xl uppercase tracking-widest border-4 border-white shadow-[8px_8px_0px_0px_rgba(239,68,68,1)] z-40 ${combos > 15 ? 'animate-pulse' : ''}`}
          >
            <div className="text-xs text-red-500 mb-1 font-black uppercase tracking-tighter flex items-center gap-1">
              <Flame className={`w-3 h-3 ${combos > 10 ? 'text-orange-500' : 'text-slate-500'}`} />
              Combo Streak
            </div>
            <motion.div
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ duration: 0.2 }}
              className="flex items-baseline gap-1"
            >
              {combos}<span className="text-xl text-red-500">x</span>
            </motion.div>
            <div className="w-full h-2 bg-slate-700 mt-2 border border-slate-600 overflow-hidden">
              <motion.div 
                key={combos}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 2.5, ease: 'linear' }}
                className={`h-full ${combos > 10 ? 'bg-orange-500' : 'bg-red-500'}`}
              />
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Footer Controls */}
      <div className="p-4 border-t-8 border-slate-900 flex justify-between items-center bg-slate-50">
        <div className="flex gap-2">
          <button onClick={() => setGameState('SHOP')} className="p-2 border-4 border-slate-900 hover:bg-slate-200"><ShoppingCart /></button>
          <button onClick={() => setGameState('INFO')} className="p-2 border-4 border-slate-900 hover:bg-slate-200"><Info /></button>
        </div>
        <div className="font-black uppercase tracking-widest text-slate-400">Total: {totalPoints} pts</div>
      </div>
    </div>
  );

  const renderShop = () => (
    <div className="absolute inset-0 bg-white z-50 p-6 md:p-12 flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => setGameState('START')} className="p-2 md:p-3 border-4 border-slate-900 hover:bg-slate-100 transition-colors neo-brutalist-shadow">
            <ArrowLeft className="w-6 h-6 md:w-8 md:h-8" />
          </button>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">Metabolic Shop</h2>
        </div>
        <div className="text-xl md:text-3xl font-black bg-slate-900 text-white px-4 py-2 md:px-6 md:py-3 neo-brutalist-shadow self-end md:self-auto border-4 border-white">
          <span className="text-xs md:text-sm text-slate-400 block uppercase tracking-widest mb-1">Available Credits</span>
          {totalPoints} PTS
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-6 flex-1 overflow-y-auto pr-2 md:pr-4 custom-scrollbar">
        <div className="mb-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6 border-b-4 border-slate-200 pb-2 flex items-center gap-2"><Shield className="w-5 h-5" /> Defensive Upgrades</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {SHOP_ITEMS.map(item => {
              const isOnCooldown = item.id.startsWith('SABOTAGE_') && sabotageCooldowns[item.id] && Date.now() < sabotageCooldowns[item.id];
              const cooldownRemaining = isOnCooldown ? Math.ceil((sabotageCooldowns[item.id] - Date.now()) / 1000) : 0;
              
              return (
              <button 
                key={item.id}
                onClick={() => buyItem(item)}
                disabled={totalPoints < item.cost || isOnCooldown}
                className={`group flex items-center gap-4 md:gap-6 p-4 md:p-6 border-4 border-slate-900 text-left transition-all relative ${(totalPoints >= item.cost && !isOnCooldown) ? 'bg-white hover:bg-slate-50 neo-brutalist-shadow hover:-translate-y-1' : 'bg-slate-100 opacity-40 grayscale cursor-not-allowed'}`}
              >
                <div className="p-3 md:p-4 border-4 border-slate-900 bg-white group-hover:scale-110 transition-transform shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">{item.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-2xl font-black uppercase tracking-tight">{item.name}</h3>
                  <p className="text-slate-500 font-bold text-xs md:text-sm line-clamp-2">{item.description}</p>
                </div>
                <div className="flex flex-col items-end">
                  {isOnCooldown ? (
                    <div className="text-xl md:text-2xl font-black text-red-500">{cooldownRemaining}s</div>
                  ) : (
                    <>
                      <div className="text-xl md:text-3xl font-black tabular-nums">{item.cost}</div>
                      <div className="text-[10px] font-black uppercase text-slate-400">Credits</div>
                    </>
                  )}
                </div>
              </button>
            )})}
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-sm font-black uppercase tracking-widest text-red-500 mb-6 border-b-4 border-red-100 pb-2 flex items-center gap-2"><Zap className="w-5 h-5" /> Class Sabotage (Multiplayer)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {SABOTAGE_ITEMS.map(item => {
              const isOnCooldown = item.id.startsWith('SABOTAGE_') && sabotageCooldowns[item.id] && Date.now() < sabotageCooldowns[item.id];
              const cooldownRemaining = isOnCooldown ? Math.ceil((sabotageCooldowns[item.id] - Date.now()) / 1000) : 0;
              
              return (
              <button 
                key={item.id}
                onClick={() => buyItem(item)}
                disabled={totalPoints < item.cost || isOnCooldown}
                className={`group flex items-center gap-4 md:gap-6 p-4 md:p-6 border-4 border-red-600 text-left transition-all relative ${(totalPoints >= item.cost && !isOnCooldown) ? 'bg-white hover:bg-red-50 neo-brutalist-shadow hover:-translate-y-1' : 'bg-slate-100 opacity-40 grayscale cursor-not-allowed'}`}
              >
                <div className="p-3 md:p-4 border-4 border-red-600 bg-white group-hover:scale-110 transition-transform shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]">{item.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-red-600">{item.name}</h3>
                  <p className="text-slate-500 font-bold text-xs md:text-sm line-clamp-2">{item.description}</p>
                </div>
                <div className="flex flex-col items-end">
                  {isOnCooldown ? (
                    <div className="text-xl md:text-2xl font-black text-red-500">{cooldownRemaining}s</div>
                  ) : (
                    <>
                      <div className="text-xl md:text-3xl font-black tabular-nums text-red-600">{item.cost}</div>
                      <div className="text-[10px] font-black uppercase text-red-400">Credits</div>
                    </>
                  )}
                </div>
              </button>
            )})}
          </div>
        </div>
      </div>

      <button 
        onClick={() => setGameState(gameState === 'SHOP' ? 'START' : 'PLAYING')}
        className="mt-8 md:mt-12 bg-slate-900 text-white py-6 md:py-8 font-black text-xl md:text-3xl uppercase tracking-[0.2em] hover:bg-slate-800 transition-colors neo-brutalist-shadow border-4 border-white"
      >
        Return to Mission
      </button>
    </div>
  );

  const renderLeaderboard = () => (
    <div className="absolute inset-0 bg-white z-50 p-6 md:p-12 flex flex-col">
      <div className="flex items-center gap-4 mb-8 md:mb-12">
        <button onClick={() => setGameState('START')} className="p-2 md:p-3 border-4 border-slate-900 hover:bg-slate-100 transition-colors neo-brutalist-shadow">
          <ArrowLeft className="w-6 h-6 md:w-8 md:h-8" />
        </button>
        <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">Hall of Guardians</h2>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 md:pr-4 custom-scrollbar">
        <div className="border-4 border-slate-900 neo-brutalist-shadow overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-4 md:p-6 font-black uppercase tracking-widest text-sm md:text-base">Rank</th>
                <th className="p-4 md:p-6 font-black uppercase tracking-widest text-sm md:text-base">Guardian</th>
                <th className="p-4 md:p-6 font-black uppercase tracking-widest text-sm md:text-base text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y-4 divide-slate-900">
              {leaderboard.length > 0 ? leaderboard.map((entry, i) => (
                <tr key={i} className={`hover:bg-slate-50 transition-colors ${i === 0 ? 'bg-yellow-50' : ''}`}>
                  <td className="p-4 md:p-6 font-black text-xl md:text-2xl">
                    {i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </td>
                  <td className="p-4 md:p-6 font-black text-xl md:text-2xl uppercase tracking-tight">{entry.name}</td>
                  <td className="p-4 md:p-6 font-black text-xl md:text-2xl text-right tabular-nums">{entry.score.toLocaleString()}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="p-12 text-center text-slate-400 font-black uppercase tracking-widest">No records found in the database.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderBossIntro = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 bg-slate-950 z-40 flex flex-col items-center justify-center text-center p-6 md:p-12 overflow-hidden"
    >
      {/* Animated Lava Background */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: -100, x: Math.random() * window.innerWidth, opacity: 0 }}
            animate={{ 
              y: window.innerHeight + 100, 
              opacity: [0, 1, 1, 0],
              scale: [1, 2, 1]
            }}
            transition={{ 
              duration: 1.5 + Math.random() * 2, 
              repeat: Infinity, 
              delay: Math.random() * 3 
            }}
            className="absolute w-12 h-12 bg-red-600 rounded-full blur-2xl"
          />
        ))}
      </div>

      <motion.div 
        animate={{ scale: [1, 1.3, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 0.3, repeat: Infinity }}
        className="relative z-10"
      >
        <div className="absolute inset-0 bg-red-600 blur-3xl opacity-50 rounded-full animate-pulse" />
        <AlertCircle className="w-32 h-32 md:w-48 md:h-48 text-red-500 mb-8 relative z-10 drop-shadow-[0_0_40px_rgba(220,38,38,1)]" />
      </motion.div>
      <motion.h2 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter mb-4 relative z-10 drop-shadow-2xl"
      >
        CORE THREAT
      </motion.h2>
      <motion.p 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-xl md:text-3xl text-red-400 font-black mb-12 max-w-2xl relative z-10 uppercase tracking-[0.2em]"
      >
        The Malignant Core has emerged. Standard filtration is insufficient. Engage targeted strike.
      </motion.p>
      <motion.button 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.6 }}
        onClick={() => {
          setGameState('PLAYING');
          setTimeout(spawnBoss, 100);
        }}
        className="relative z-10 group bg-red-600 text-white px-12 py-5 md:px-16 md:py-6 text-2xl md:text-4xl font-black uppercase tracking-[0.2em] rounded-full shadow-[0_0_40px_rgba(220,38,38,0.5)] hover:shadow-[0_0_80px_rgba(220,38,38,0.8)] hover:bg-red-500 transition-all overflow-hidden"
      >
        <span className="relative z-10 flex items-center gap-4">
          Engage Protocol <Skull className="w-8 h-8 group-hover:scale-125 transition-transform" />
        </span>
      </motion.button>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-slate-200 flex p-0 md:p-4 overflow-y-auto">
      <main className={`m-auto w-full md:max-w-4xl min-h-screen md:min-h-[900px] bg-white border-0 md:border-[12px] border-slate-900 shadow-none md:shadow-[30px_30px_0px_0px_rgba(15,23,42,1)] overflow-y-auto overflow-x-hidden relative flex flex-col transition-all duration-500 ${isBlurry ? 'blur-md' : ''} ${isInverted ? 'invert' : ''} ${isMirror ? '-scale-x-100' : ''} ${screenShake ? 'animate-[shake_0.2s_ease-in-out_infinite]' : ''} ${isSpinning ? 'animate-spin' : ''}`}>
        {gameState === 'LOGIN' && (
          <div className="flex flex-col items-center justify-center p-6 md:p-12 flex-1 py-12 bg-slate-50">
            <div className="w-full max-w-md bg-white border-8 border-slate-900 p-8 neo-brutalist-shadow">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-slate-900 text-white rounded-full">
                  <Lock className="w-12 h-12" />
                </div>
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tighter text-center mb-8">Guardian Access</h2>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleLogin(formData.get('username') as string, formData.get('password') as string);
              }} className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Username (Full Name)</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                      name="username"
                      type="text" 
                      placeholder="e.g. Arnav Sharma"
                      className="w-full pl-12 pr-4 py-4 border-4 border-slate-900 font-bold focus:outline-none focus:bg-slate-50 transition-colors"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Access Key</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                      name="password"
                      type="password" 
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-4 border-4 border-slate-900 font-bold focus:outline-none focus:bg-slate-50 transition-colors"
                      required
                    />
                  </div>
                </div>

                {loginError && (
                  <div className="p-4 bg-red-100 border-4 border-red-600 text-red-600 font-bold text-sm flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" /> {loginError}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isLoggingIn}
                  className={`w-full py-5 bg-slate-900 text-white font-black uppercase text-xl transition-all neo-brutalist-shadow border-4 border-white ${isLoggingIn ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800'}`}
                >
                  {isLoggingIn ? 'Authorizing...' : 'Authorize Entry'}
                </button>
              </form>
              
              <p className="mt-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                Authorized Personnel Only • HepatoHero System v2.0
              </p>
            </div>
          </div>
        )}
        {gameState === 'START' && renderStartScreen()}
        {gameState === 'DIFFICULTY' && (
          <div className="flex flex-col items-center justify-center p-6 md:p-12 flex-1 py-12">
            <h2 className="text-3xl md:text-4xl font-black uppercase mb-12">Select Intensity</h2>
            <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
              {(['EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map(d => (
                <button key={d} onClick={() => startGame(d)} className="p-6 border-4 border-slate-900 font-black text-2xl uppercase hover:bg-slate-900 hover:text-white neo-brutalist-shadow transition-all">{d}</button>
              ))}
            </div>
          </div>
        )}
        {gameState === 'PLAYING' && renderGameUI()}
        {gameState === 'BOSS_INTRO' && renderBossIntro()}
        {gameState === 'SHOP' && renderShop()}
        {gameState === 'LEVEL_TRANSITION' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-slate-950 z-50 flex overflow-y-auto py-12 px-6 md:px-12 custom-scrollbar"
          >
            <button 
              onClick={() => setShowExitConfirm(true)}
              className="absolute top-6 right-6 md:top-8 md:right-8 p-2 text-slate-400 hover:text-white transition-colors z-50"
              title="Exit Sector"
            >
              <X className="w-8 h-8 md:w-10 md:h-10" />
            </button>

            <div className="m-auto flex flex-col items-center w-full max-w-2xl">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 100 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
                <LiverIcon className="w-24 h-24 md:w-32 md:h-32 text-blue-400 mb-6 relative z-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
              </motion.div>
              
              <h2 className="text-2xl md:text-4xl font-black text-white uppercase mb-2 tracking-widest text-center">Entering Sector {levelIndex + 1}</h2>
              <p className="text-sm md:text-base text-blue-400 mb-10 max-w-md font-bold uppercase tracking-[0.4em] text-center">{LEVELS[levelIndex].title}</p>
              
              <div className="bg-slate-900/50 backdrop-blur-md p-8 md:p-12 border border-slate-800 rounded-2xl mb-12 w-full relative shadow-2xl">
                <div className="absolute -top-4 left-8 bg-blue-600 text-white px-4 py-1 font-black uppercase tracking-widest text-xs rounded-full shadow-lg shadow-blue-600/30">Intel Report</div>
                <h3 className="text-lg md:text-2xl font-black uppercase mb-6 flex items-center gap-3 text-white border-b border-slate-800 pb-4">
                  <Info className="text-blue-400 w-6 h-6" /> Medical Intelligence
                </h3>
                <div className="max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                  <p className="text-slate-300 text-sm md:text-lg font-medium leading-relaxed">
                    {LEVELS[levelIndex].info}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setGameState('PLAYING')}
                className="group relative bg-blue-600 text-white px-12 py-4 md:px-16 md:py-5 text-xl md:text-2xl font-black uppercase tracking-[0.2em] rounded-full shadow-[0_0_40px_rgba(37,99,235,0.4)] hover:shadow-[0_0_60px_rgba(37,99,235,0.6)] hover:bg-blue-500 transition-all mb-12 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-3">
                  Initialize Protocol <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </span>
              </button>
            </div>
          </motion.div>
        )}
        {gameState === 'LEVEL_COMPLETE' && (
          <div className="flex flex-col items-center justify-center p-12 flex-1 py-12 text-center">
            <Trophy className="w-32 h-32 text-yellow-500 mb-8" />
            <h2 className="text-6xl font-black uppercase mb-4">Mission Success</h2>
            
            <div className="bg-slate-50 border-4 border-slate-900 p-6 mb-8 w-full max-w-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="font-black uppercase text-slate-400">Health Bonus</span>
                <span className="font-black text-green-600">+{health * 5} PTS</span>
              </div>
              <div className="h-2 bg-slate-200">
                <div className="h-full bg-green-500" style={{ width: `${health}%` }} />
              </div>
            </div>

            <button 
              onClick={() => {
                setTotalPoints(p => p + (health * 5));
                nextLevel();
              }} 
              className="bg-slate-900 text-white px-12 py-6 text-2xl font-black uppercase tracking-widest neo-brutalist-shadow"
            >
              Next Sector
            </button>
          </div>
        )}
        {gameState === 'GAME_OVER' && (
          <div className="flex flex-col items-center justify-center p-12 flex-1 py-12 text-center bg-red-50">
            <AlertCircle className="w-32 h-32 text-red-600 mb-8" />
            <h2 className="text-6xl font-black uppercase text-red-600 mb-4 tracking-tighter">System Failure</h2>
            <p className="text-xl text-red-500 font-black uppercase mb-8">Liver Integrity Compromised</p>
            <div className="flex gap-4">
              <button onClick={() => setGameState('START')} className="bg-slate-900 text-white px-12 py-6 text-2xl font-black uppercase tracking-widest neo-brutalist-shadow hover:bg-slate-800 transition-colors">Reboot</button>
              <button onClick={() => setGameState('LEADERBOARD')} className="bg-white text-slate-900 border-4 border-slate-900 px-12 py-6 text-2xl font-black uppercase tracking-widest neo-brutalist-shadow hover:bg-slate-50 transition-colors">Records</button>
            </div>
          </div>
        )}
        {gameState === 'LEADERBOARD' && renderLeaderboard()}
        {gameState === 'TUTORIAL' && (
          <div className="absolute inset-0 bg-white z-50 p-6 md:p-12 flex flex-col items-center justify-center text-center overflow-y-auto custom-scrollbar">
            <div className="max-w-2xl w-full">
              <div className="flex justify-center gap-2 mb-12">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`h-3 w-12 border-2 border-slate-900 transition-colors ${tutorialStep >= i ? 'bg-slate-900' : 'bg-slate-100'}`} />
                ))}
              </div>

              {tutorialStep === 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className="relative inline-block mb-8">
                    <LiverIcon className="w-24 h-24 md:w-40 md:h-40 text-slate-900" />
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0, 0.5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-red-500 rounded-full blur-2xl -z-10"
                    />
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black uppercase mb-6 tracking-tighter">Welcome, Guardian</h2>
                  <p className="text-lg md:text-2xl text-slate-600 mb-8 font-bold leading-tight">The liver is your body's chemical processing plant. Your job is to neutralize threats before they cause damage.</p>
                </motion.div>
              )}
              {tutorialStep === 1 && (
                <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}>
                  <div className="flex justify-center gap-8 mb-12">
                    <div className="group relative">
                      <div className="w-20 h-20 md:w-28 md:h-28 border-8 border-slate-900 flex items-center justify-center bg-white neo-brutalist-shadow"><Beer className="text-amber-500 w-12 h-12" /></div>
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 font-black uppercase">Alcohol</div>
                    </div>
                    <div className="group relative">
                      <div className="w-20 h-20 md:w-28 md:h-28 border-8 border-slate-900 flex items-center justify-center bg-white neo-brutalist-shadow"><Skull className="text-slate-600 w-12 h-12" /></div>
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 font-black uppercase">Toxin</div>
                    </div>
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black uppercase mb-6 tracking-tighter">Neutralize Threats</h2>
                  <p className="text-lg md:text-2xl text-slate-600 mb-8 font-bold leading-tight">Click on Alcohol and Toxins to destroy them. If they reach the bottom, your Liver Integrity drops. Speed increases over time!</p>
                </motion.div>
              )}
              {tutorialStep === 2 && (
                <motion.div initial={{ opacity: 0, rotate: -5 }} animate={{ opacity: 1, rotate: 0 }}>
                  <div className="relative w-24 h-24 md:w-32 md:h-32 border-8 border-slate-900 flex items-center justify-center mx-auto mb-12 bg-red-50 neo-brutalist-shadow">
                    <Dna className="text-indigo-600 w-16 h-16" />
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-4 border-dashed border-red-500 rounded-full"
                    />
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black uppercase mb-6 tracking-tighter">Cancer Mutation</h2>
                  <p className="text-lg md:text-2xl text-slate-600 mb-8 font-bold leading-tight">Cancer cells are tough. If you don't destroy them quickly, they mutate, turn red, and move twice as fast!</p>
                </motion.div>
              )}
              {tutorialStep === 3 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex flex-col items-center gap-8 mb-12">
                    <div className="flex gap-6">
                      <div className="p-4 border-4 border-slate-900 bg-white neo-brutalist-shadow"><Shield className="text-yellow-500 w-10 h-10" /></div>
                      <div className="p-4 border-4 border-slate-900 bg-white neo-brutalist-shadow"><Flame className="text-orange-500 w-10 h-10" /></div>
                      <div className="p-4 border-4 border-slate-900 bg-white neo-brutalist-shadow"><Clock className="text-purple-500 w-10 h-10" /></div>
                    </div>
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1], rotate: [-2, 2, -2] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="bg-slate-900 p-4 border-4 border-white neo-brutalist-shadow"
                    >
                      <div className="text-white font-black text-3xl md:text-5xl uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-purple-500">Combo 15x</div>
                    </motion.div>
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black uppercase mb-6 tracking-tighter">Master Scoring</h2>
                  <p className="text-lg md:text-2xl text-slate-600 mb-8 font-bold leading-tight">Maintain high combos for massive point bonuses. Use the shop to buy power-ups and keep your integrity at 100%!</p>
                </motion.div>
              )}

              <div className="flex gap-6 justify-center mt-12">
                {tutorialStep > 0 && (
                  <button onClick={() => setTutorialStep(s => s - 1)} className="px-10 py-5 border-8 border-slate-900 font-black uppercase text-xl hover:bg-slate-50 transition-all neo-brutalist-shadow">Back</button>
                )}
                <button 
                  onClick={() => tutorialStep < 3 ? setTutorialStep(s => s + 1) : setGameState('DIFFICULTY')} 
                  className="px-10 py-5 bg-slate-900 text-white font-black uppercase text-xl hover:bg-slate-800 transition-all neo-brutalist-shadow border-8 border-white"
                >
                  {tutorialStep < 3 ? 'Next Phase' : 'Begin Mission'}
                </button>
              </div>
            </div>
          </div>
        )}
        {gameState === 'GAME_FINISHED' && (
          <div className="absolute inset-0 bg-green-50 z-50 p-6 md:p-12 flex flex-col items-center justify-center text-center overflow-y-auto custom-scrollbar">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-2xl w-full space-y-8"
            >
              <div className="relative inline-block">
                <motion.div
                  animate={{ 
                    scale: [1, 1.05, 1],
                    rotate: [0, 2, -2, 0]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="relative z-10"
                >
                  <div className="w-64 h-64 md:w-80 md:h-80 bg-white rounded-full border-[12px] border-green-600 neo-brutalist-shadow mx-auto flex items-center justify-center p-8 overflow-hidden">
                    <LiverIcon className="w-full h-full text-green-500 drop-shadow-[0_0_20px_rgba(34,197,94,0.4)]" />
                  </div>
                </motion.div>
                <div className="absolute -top-4 -right-4 bg-yellow-400 border-4 border-slate-900 p-4 rotate-12 neo-brutalist-shadow z-20">
                  <Trophy className="w-8 h-8 md:w-12 md:h-12 text-slate-900" />
                </div>
                {/* Confetti particles */}
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      y: [-20, -100, -20],
                      x: [0, (i % 2 === 0 ? 50 : -50), 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                    className="absolute top-1/2 left-1/2 w-3 h-3 bg-yellow-400 rounded-full"
                    style={{ marginLeft: (i - 6) * 20 }}
                  />
                ))}
              </div>

              <div className="space-y-4">
                <motion.h2 
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none text-green-700"
                >
                  THANKS GUARDIAN!
                </motion.h2>
                <p className="text-xl md:text-3xl font-black text-slate-600 max-w-lg mx-auto uppercase tracking-tight">
                  The malignant core has been eradicated. The liver is functioning at <span className="text-green-600">100% capacity</span> thanks to your intervention.
                </p>
              </div>

              <div className="p-8 border-[8px] border-slate-900 bg-white neo-brutalist-shadow inline-block relative">
                <div className="absolute -top-4 -left-4 bg-slate-900 text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest">Final Mission Score</div>
                <p className="text-5xl md:text-8xl font-black tabular-nums text-slate-900">{score.toLocaleString()}</p>
                <div className="mt-2 text-xs font-black text-slate-400 uppercase tracking-widest">Guardian Rank: Master Filter</div>
              </div>

              <div className="flex flex-col md:flex-row gap-6 justify-center pt-8">
                <button 
                  onClick={() => {
                    setLevelIndex(0);
                    setGameState('START');
                    setScore(0);
                    setTotalPoints(p => p + (health * 5));
                  }}
                  className="px-12 py-6 bg-slate-900 text-white font-black uppercase text-2xl hover:bg-slate-800 transition-all neo-brutalist-shadow border-[8px] border-white flex items-center justify-center gap-4 group"
                >
                  <RotateCcw className="w-8 h-8 group-hover:rotate-180 transition-transform duration-500" /> Restart Mission
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {gameState === 'INFO' && (
          <div className="absolute inset-0 bg-slate-950 z-50 p-6 md:p-12 overflow-y-auto custom-scrollbar text-slate-300">
            <div className="flex justify-between items-center mb-8 md:mb-12 border-b border-slate-800 pb-6">
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-widest text-white flex items-center gap-4">
                <Activity className="text-blue-500 w-8 h-8 md:w-12 md:h-12" /> Science Lab
              </h2>
              <button onClick={() => setGameState('START')} className="p-3 bg-slate-900 rounded-full hover:bg-slate-800 transition-colors border border-slate-700 text-white"><X className="w-6 h-6 md:w-8 md:h-8" /></button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 max-w-7xl mx-auto">
              <div className="space-y-6 md:space-y-8">
                <section className="p-8 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl shadow-xl">
                  <h3 className="text-xl md:text-2xl font-black uppercase mb-6 flex items-center gap-3 text-white"><Activity className="text-blue-400" /> Liver Functions</h3>
                  <ul className="space-y-4 text-slate-400 font-medium text-sm md:text-base">
                    <li className="flex items-start gap-3"><span className="text-blue-400 font-black">01.</span> Detoxification of harmful substances</li>
                    <li className="flex items-start gap-3"><span className="text-blue-400 font-black">02.</span> Protein synthesis for blood clotting</li>
                    <li className="flex items-start gap-3"><span className="text-blue-400 font-black">03.</span> Bile production for digestion</li>
                    <li className="flex items-start gap-3"><span className="text-blue-400 font-black">04.</span> Glycogen storage for energy</li>
                  </ul>
                </section>

                <section className="p-8 bg-red-950/30 backdrop-blur-md border border-red-900/50 rounded-2xl shadow-xl">
                  <h3 className="text-xl md:text-2xl font-black uppercase mb-4 flex items-center gap-3 text-red-400"><AlertCircle className="text-red-500" /> Liver Cancer</h3>
                  <p className="text-slate-300 leading-relaxed font-medium text-sm md:text-base">
                    Hepatocellular Carcinoma (HCC) is the most common type. It often develops in the setting of chronic liver disease (cirrhosis) caused by hepatitis B or C infection, or heavy alcohol use.
                  </p>
                </section>
              </div>

              <div className="space-y-6 md:space-y-8">
                <section className="p-8 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl shadow-xl">
                  <h3 className="text-xl md:text-2xl font-black uppercase mb-6 text-white">Toxin Variants</h3>
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <div className="p-3 bg-slate-900 rounded-lg"><Skull className="text-slate-400 w-6 h-6 md:w-8 md:h-8" /></div>
                      <div>
                        <p className="font-black uppercase text-sm md:text-base text-white">Heavy Metals</p>
                        <p className="text-xs md:text-sm text-slate-400 font-medium mt-1">Lead, Mercury, and Arsenic accumulate in liver tissue.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                      <div className="p-3 bg-slate-900 rounded-lg"><Droplets className="text-lime-400 w-6 h-6 md:w-8 md:h-8" /></div>
                      <div>
                        <p className="font-black uppercase text-sm md:text-base text-lime-300">Pesticides</p>
                        <p className="text-xs md:text-sm text-slate-400 font-medium mt-1">Agricultural chemicals that require intense filtration.</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="p-8 bg-indigo-950/30 backdrop-blur-md border border-indigo-900/50 rounded-2xl shadow-xl">
                  <h3 className="text-xl md:text-2xl font-black uppercase mb-4 text-indigo-400">Prevention</h3>
                  <p className="text-slate-300 leading-relaxed italic font-bold text-sm md:text-base">
                    "A healthy liver is a silent hero. Limit alcohol, maintain a healthy weight, and get vaccinated against Hepatitis."
                  </p>
                </section>
              </div>
            </div>
            <div className="h-12" /> {/* Spacer */}
          </div>
        )}

        <AnimatePresence>
          {showExitConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white border-8 border-slate-900 p-8 max-w-md w-full neo-brutalist-shadow text-center"
              >
                <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-6" />
                <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Abort Mission?</h3>
                <p className="text-slate-600 font-bold mb-8">
                  Do you want to exit? It will not save your progress for this sector.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowExitConfirm(false)}
                    className="flex-1 border-4 border-slate-900 py-4 font-black uppercase hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowExitConfirm(false);
                      setGameState('START');
                      setScore(0);
                      setEntities([]);
                      setBossActive(false);
                    }}
                    className="flex-1 bg-red-600 text-white border-4 border-slate-900 py-4 font-black uppercase hover:bg-red-700 transition-colors"
                  >
                    Exit
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeEasterEgg && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className="fixed right-4 top-4 md:right-8 md:top-8 z-[9999] pointer-events-none max-w-xs"
            >
              <div className={`bg-slate-900 border-4 border-white p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] relative ${activeEasterEgg.isRare ? 'bg-gradient-to-br from-yellow-600 to-yellow-900 border-yellow-400' : ''}`}>
                <div className="absolute -top-3 -left-3 bg-red-600 text-white px-2 py-1 font-black uppercase tracking-widest text-[10px] animate-pulse border-2 border-white">SECRET!</div>
                <p className="text-sm font-black uppercase tracking-tighter leading-tight text-white mt-2">
                  "{activeEasterEgg.message}"
                </p>
                <div className="mt-3 flex items-center gap-2 text-yellow-400 font-black uppercase tracking-widest text-xs bg-black/50 p-2 border-2 border-white/20">
                  <Zap className="w-4 h-4 fill-yellow-400" /> 
                  <span>{activeEasterEgg.powerup.replace('_', ' ')}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
