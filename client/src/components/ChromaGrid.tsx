import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import './ChromaGrid.css';

export interface ChromaItem {
  image: string;
  title: string;
  subtitle: string;
  location: string;
  borderColor: string;
  gradient: string;
  url: string;
  rating: number;
}

export interface ChromaGridProps {
  items?: ChromaItem[];
  className?: string;
  radius?: number;
  columns?: number;
  rows?: number;
  damping?: number;
  fadeOut?: number;
  ease?: string;
}

type SetterFn = (v: number | string) => void;

export const ChromaGrid: React.FC<ChromaGridProps> = ({
  items,
  className = '',
  radius = 300,
  columns = 3,
  rows = 2,
  damping = 0.45,
  fadeOut = 0.6,
  ease = 'power3.out',
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const setX = useRef<SetterFn | null>(null);
  const setY = useRef<SetterFn | null>(null);
  const pos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    setX.current = gsap.quickSetter(el, '--x', 'px') as SetterFn;
    setY.current = gsap.quickSetter(el, '--y', 'px') as SetterFn;

    const { width, height } = el.getBoundingClientRect();
    pos.current = { x: width / 2, y: height / 2 };
    setX.current(pos.current.x);
    setY.current(pos.current.y);
  }, []);

  const moveTo = (x: number, y: number) => {
    gsap.to(pos.current, {
      x,
      y,
      duration: damping,
      ease,
      onUpdate: () => {
        setX.current?.(pos.current.x);
        setY.current?.(pos.current.y);
      },
      overwrite: true,
    });
  };

  const handleMove = (e: React.PointerEvent) => {
    const r = rootRef.current!.getBoundingClientRect();
    moveTo(e.clientX - r.left, e.clientY - r.top);
    gsap.to(fadeRef.current, { opacity: 0, duration: 0.25, overwrite: true });
  };

  const handleLeave = () => {
    gsap.to(fadeRef.current, {
      opacity: 1,
      duration: fadeOut,
      overwrite: true,
    });
  };

  const handleCardClick = (url?: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCardMove: React.MouseEventHandler<HTMLElement> = (e) => {
    const card = e.currentTarget as HTMLElement;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  const demo: ChromaItem[] = [
    {
      image: 'https://i.pravatar.cc/300?img=8',
      title: 'Alex Rivera',
      subtitle: 'Full Stack Developer',
      location: 'San Francisco, CA',
      borderColor: '#4F46E5',
      gradient: 'linear-gradient(145deg, #4F46E5, #000)',
      url: 'https://github.com/alexrivera',
      rating: 4.8
    },
    {
      image: 'https://i.pravatar.cc/300?img=11',
      title: 'Jordan Chen',
      subtitle: 'DevOps Engineer',
      location: 'New York, NY',
      borderColor: '#10B981',
      gradient: 'linear-gradient(210deg, #10B981, #000)',
      url: 'https://linkedin.com/in/jordanchen',
      rating: 4.9
    },
    {
      image: 'https://i.pravatar.cc/300?img=3',
      title: 'Morgan Blake',
      subtitle: 'UI/UX Designer',
      location: 'Austin, TX',
      borderColor: '#F59E0B',
      gradient: 'linear-gradient(165deg, #F59E0B, #000)',
      url: 'https://dribbble.com/morganblake',
      rating: 4.7
    },
    {
      image: 'https://i.pravatar.cc/300?img=16',
      title: 'Casey Park',
      subtitle: 'Data Scientist',
      location: 'Seattle, WA',
      borderColor: '#EF4444',
      gradient: 'linear-gradient(195deg, #EF4444, #000)',
      url: 'https://kaggle.com/caseypark',
      rating: 4.6
    },
    {
      image: 'https://i.pravatar.cc/300?img=25',
      title: 'Sam Kim',
      subtitle: 'Mobile Developer',
      location: 'Boston, MA',
      borderColor: '#8B5CF6',
      gradient: 'linear-gradient(225deg, #8B5CF6, #000)',
      url: 'https://github.com/thesamkim',
      rating: 4.5
    },
    {
      image: 'https://i.pravatar.cc/300?img=60',
      title: 'Tyler Rodriguez',
      subtitle: 'Cloud Architect',
      location: 'Denver, CO',
      borderColor: '#06B6D4',
      gradient: 'linear-gradient(135deg, #06B6D4, #000)',
      url: 'https://aws.amazon.com/',
      rating: 4.9
    },
  ];

  const data = items?.length ? items : demo;

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push('★');
      } else if (i === fullStars && hasHalfStar) {
        stars.push('☆'); // You could use a different character for half star
      } else {
        stars.push('☆');
      }
    }

    return stars.join('');
  };

  return (
    <div
      ref={rootRef}
      className={`chroma-grid ${className}`}
      style={
        {
          '--r': `${radius}px`,
          '--cols': columns,
          '--rows': rows,
        } as React.CSSProperties
      }
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      {data.map((c, i) => (
        <article
          key={i}
          className="chroma-card"
          onMouseMove={handleCardMove}
          onClick={() => handleCardClick(c.url)}
          style={
            {
              '--card-border': c.borderColor || 'transparent',
              '--card-gradient': c.gradient,
              cursor: c.url ? 'pointer' : 'default',
            } as React.CSSProperties
          }
        >
          <div className="chroma-img-wrapper">
            <img src={c.image} alt={c.title} loading="lazy" />
          </div>
          <footer className="chroma-info">
            <h3 className="name">{c.title}</h3>
            <div className="rating">
              {renderStars(c.rating)}
              <span className="rating-value"> ({c.rating})</span>
            </div>
            <p className="role">{c.subtitle}</p>
            <span className="location">{c.location}</span>
          </footer>
        </article>
      ))}
      <div className="chroma-overlay" />
      <div ref={fadeRef} className="chroma-fade" />
    </div>
  );
};

export default ChromaGrid;