import React, { useState, useEffect, useRef, Component } from 'react';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { animate, stagger } from 'animejs';
import Spline from '@splinetool/react-spline';
import { Button, Card } from '@infrasuite/shared';
import { db } from '@infrasuite/firebase';

// 1. React Error Boundary to catch Spline runtime/deserialization crashes
interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
}
class SplineErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.warn("Spline player crashed, switching to local WebGL fallback:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// 2. High-Poly Rotating Wireframe Torus Knot (Local Three.js Fallback)
const ThreeFallbackVisual: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Torus Knot Tech Geometry
    const geometry = new THREE.TorusKnotGeometry(2.2, 0.6, 120, 16);
    const material = new THREE.MeshPhongMaterial({
      color: 0x00f0ff,
      emissive: 0x110030,
      specular: 0xffffff,
      shininess: 100,
      wireframe: true // Cyber wireframe style grid
    });

    const torusKnot = new THREE.Mesh(geometry, material);
    scene.add(torusKnot);

    // Neon Lights
    const pointLight = new THREE.PointLight(0x00f0ff, 2, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const ambientLight = new THREE.AmbientLight(0x8b5cf6, 0.6);
    scene.add(ambientLight);

    // Resize
    const handleResize = () => {
      if (!canvas) return;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    let animationId: number;
    const renderLoop = () => {
      torusKnot.rotation.x += 0.006;
      torusKnot.rotation.y += 0.01;
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
  );
};

export const FALLBACK_MODULES_INFO: Record<string, { icon: string; nombre: string; desc: string }> = {
  INFRACOST: {
    icon: '📊',
    nombre: 'InfraCost',
    desc: 'Gestión avanzada de costos, presupuestos de obra y Análisis de Precios Unitarios (APU) integrados.'
  },
  INFRAGEO: {
    icon: '🕳️',
    nombre: 'InfraGeo',
    desc: 'Mapeo geotécnico, modelado de sondajes y registro de ensayos de mecánica de suelos en campo.'
  },
  INFRABIM: {
    icon: '📐',
    nombre: 'InfraBIM',
    desc: 'Visualización y coordinación de modelos 3D en formato abierto IFC directamente en el navegador.'
  },
  INFRACONTROL: {
    icon: '📈',
    nombre: 'InfraControl',
    desc: 'Seguimiento financiero de obra, generación de valorizaciones mensuales y curvas S de avance.'
  },
  INFRADOCS: {
    icon: '📂',
    nombre: 'InfraDocs',
    desc: 'Gestión documental y almacenamiento estructurado de planos, contratos e informes técnicos.'
  },
  INFRAFIELD: {
    icon: '📋',
    nombre: 'InfraField',
    desc: 'Órdenes de inspección, diarios de obra digitales y reportes fotográficos geo-localizados.'
  },
  INFRAAI: {
    icon: '🧠',
    nombre: 'InfraAI',
    desc: 'Predicción de desviaciones de costo y análisis de riesgo mediante algoritmos de Inteligencia Artificial.'
  },
  INFRAADMIN: {
    icon: '🛡️',
    nombre: 'InfraAdmin',
    desc: 'Consola central de gobernanza para la gestión de usuarios, roles, empresas y licencias de la suite.'
  }
};

export const getModuleInfo = (m: any) => {
  const code = (m.codigo || m.id || '').toUpperCase();
  const fallback = FALLBACK_MODULES_INFO[code] || { icon: '🔧', nombre: m.nombre || code, desc: m.desc || '' };
  return {
    id: m.id || m.codigo,
    codigo: code,
    nombre: m.nombre || fallback.nombre,
    icon: m.icon || fallback.icon,
    desc: m.desc || fallback.desc,
    activo: m.activo !== false,
    visibleLanding: m.visibleLanding !== false
  };
};

interface LandingPageProps {
  onStartLogin: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartLogin, theme, toggleTheme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);

  const [plans, setPlans] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [currency, setCurrency] = useState<'PEN' | 'USD'>('PEN');
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const fetchedPlans = await db.getDocs('plans');
      const fetchedClients = await db.getDocs('clients');
      const fetchedModules = await db.getDocs('modules');
      setPlans(fetchedPlans);
      setClients(fetchedClients);
      setModules(fetchedModules);
    };
    loadData();
  }, []);

  // Three.js Interactive Constellation Particle Scene
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.z = 60;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const particlesCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particlesCount * 3);
    const velocities = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 160;
      positions[i + 1] = (Math.random() - 0.5) * 120;
      positions[i + 2] = (Math.random() - 0.5) * 100;

      velocities[i] = (Math.random() - 0.5) * 0.08;
      velocities[i + 1] = (Math.random() - 0.5) * 0.08;
      velocities[i + 2] = (Math.random() - 0.5) * 0.08;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 1.6,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth - 0.5) * 15;
      mouseY = -(event.clientY / window.innerHeight - 0.5) * 15;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    let animationId: number;
    const tick = () => {
      const positionAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
      const array = positionAttr.array as Float32Array;

      for (let i = 0; i < particlesCount * 3; i += 3) {
        array[i] += velocities[i];
        array[i + 1] += velocities[i + 1];
        array[i + 2] += velocities[i + 2];

        if (Math.abs(array[i]) > 85) velocities[i] *= -1;
        if (Math.abs(array[i + 1]) > 65) velocities[i + 1] *= -1;
        if (Math.abs(array[i + 2]) > 60) velocities[i + 2] *= -1;
      }

      positionAttr.needsUpdate = true;

      points.rotation.y += 0.0006;
      points.rotation.x = THREE.MathUtils.lerp(points.rotation.x, mouseY * 0.015, 0.05);
      points.rotation.y = THREE.MathUtils.lerp(points.rotation.y, mouseX * 0.015, 0.05);

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  // Anime.js Pricing Counter Count-up triggered on viewport scroll
  useEffect(() => {
    if (plans.length === 0) return;
    if (!hasIntersected) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setHasIntersected(true);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );

      if (pricingRef.current) {
        observer.observe(pricingRef.current);
      }

      return () => {
        observer.disconnect();
      };
    }
  }, [plans, hasIntersected]);

  useEffect(() => {
    if (!hasIntersected || plans.length === 0) return;

    animate('.price-counter', {
      innerHTML: [0, (el: HTMLElement) => parseInt(el.getAttribute('data-target') || '0', 10)],
      round: 1,
      easing: 'easeOutExpo',
      duration: 1500,
      delay: stagger(100)
    });
  }, [currency, hasIntersected, plans]);

    // modulesList removed to read from state instead

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  } as const;

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, damping: 15 } }
  } as const;

  const pricingContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  } as const;

  const pricingCardVariants = {
    hidden: { y: 50, scale: 0.95, opacity: 0 },
    show: { 
      y: 0, 
      scale: 1, 
      opacity: 1, 
      transition: { type: 'spring', stiffness: 80, damping: 14 } 
    }
  } as const;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      
      {/* Three.js Particle Background canvas */}
      <canvas ref={canvasRef} className="hero-canvas" />

      {/* Navigation Header */}
      <motion.header 
        className="landing-nav"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ position: 'relative', zIndex: 50 }}
      >
        <div className="logo-container">
          <div className="logo-icon">I</div>
          <span className="logo-text">InfraSuite</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.4rem',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              transition: 'background 0.2s'
            }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <Button onClick={onStartLogin}>Acceder a la Consola</Button>
        </div>
      </motion.header>

      {/* Two-Column Animated Hero Section */}
      <section className="landing-hero" style={{ position: 'relative', zIndex: 10 }}>
        <div className="hero-layout">
          {/* Left Column - Hero Text */}
          <div className="hero-text">
            <motion.h1 
              className="landing-title-main"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, type: 'spring', stiffness: 70 }}
            >
              La Suite Digital Completa para <span>Ingeniería y Construcción</span>
            </motion.h1>
            
            <motion.p 
              className="landing-subtitle-main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              style={{ textAlign: 'left', marginLeft: 0 }}
            >
              Unifica presupuestos, geotecnia, modelos BIM y análisis de inteligencia artificial en una sola plataforma multiempresa, colaborativa y con soporte offline.
            </motion.p>
            
            <motion.div 
              style={{ display: 'flex', gap: '16px', justifyContent: 'flex-start' }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6, type: 'spring', stiffness: 80 }}
            >
              <Button onClick={onStartLogin} style={{ padding: '14px 32px', fontSize: '1rem' }}>
                Comenzar Ahora (SSO)
              </Button>
              <a href="#modulos" className="btn btn-secondary" style={{ padding: '14px 32px', fontSize: '1rem' }}>
                Explorar Módulos
              </a>
            </motion.div>
          </div>

          {/* Right Column - Spline 3D Viewer inside Error Boundary */}
          <motion.div 
            className="hero-visual"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8, type: 'spring', stiffness: 60 }}
          >
            <SplineErrorBoundary fallback={<ThreeFallbackVisual />}>
              <React.Suspense fallback={
                <div className="hero-visual-fallback">
                  <div className="hero-visual-fallback-spinner"></div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Cargando modelo interactivo 3D...</p>
                </div>
              }>
                {/* Using a highly compatible interactive Spline bubble scene */}
                <Spline 
                  scene="https://prod.spline.design/6Wq1Q7YGyM2G2Gki/scene.splinecode" 
                  style={{ width: '100%', height: '100%' }}
                />
              </React.Suspense>
            </SplineErrorBoundary>
          </motion.div>
        </div>
      </section>

      {/* Modules Feature Grid */}
      <section id="modulos" className="landing-section" style={{ position: 'relative', zIndex: 10 }}>
        <motion.h2 
          className="section-title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
        >
          Ecosistema Modular Integrado
        </motion.h2>
        
        <motion.p 
          className="section-subtitle"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          Cada herramienta funciona de forma independiente en su base local, pero se sincronizan en la nube compartiendo la misma seguridad y directorio de usuarios.
        </motion.p>
        
        <motion.div 
          className="modules-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
        >
          {((modules.length > 0 ? modules : Object.entries(FALLBACK_MODULES_INFO).map(([code, m]) => ({ codigo: code, ...m }))))
            .map(getModuleInfo)
            .filter((m) => m.visibleLanding)
            .map((m, index) => (
              <motion.div key={m.id || index} variants={itemVariants}>
                <Card className="module-card">
                  <div className="module-card-icon">{m.icon}</div>
                  <h3 className="module-card-title">{m.nombre}</h3>
                  <p className="module-card-desc">{m.desc}</p>
                </Card>
              </motion.div>
            ))}
        </motion.div>
      </section>

      {/* Promotions & Pricing Section */}
      <section id="promociones" ref={pricingRef} className="landing-section" style={{ background: 'rgba(255,255,255,0.01)', position: 'relative', zIndex: 10 }}>
        <motion.h2 
          className="section-title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
        >
          Planes y Promociones Activas
        </motion.h2>
        
        <motion.p 
          className="section-subtitle"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          Elige el nivel de escala que tu corporación necesita. Todos los planes anuales incluyen las promociones detalladas a continuación.
        </motion.p>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '4px',
            borderRadius: '100px',
            border: '1px solid var(--border-color)',
            backdropFilter: 'blur(8px)'
          }}>
            <button
              type="button"
              onClick={() => setCurrency('PEN')}
              style={{
                background: currency === 'PEN' ? 'var(--color-primary)' : 'transparent',
                color: currency === 'PEN' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '100px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                transition: 'all 0.2s',
                outline: 'none'
              }}
            >
              Soles (PEN)
            </button>
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              style={{
                background: currency === 'USD' ? 'var(--color-primary)' : 'transparent',
                color: currency === 'USD' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '100px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                transition: 'all 0.2s',
                outline: 'none'
              }}
            >
              Dólares (USD)
            </button>
          </div>
        </div>

        <motion.div 
          className="pricing-grid"
          variants={pricingContainerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-100px' }}
        >
          {plans.length === 0 ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={`skeleton-price-${idx}`} className="card price-card" style={{ height: '100%' }}>
                <span className="skeleton" style={{ width: '45%', height: '20px', marginBottom: '16px' }}></span>
                <div className="skeleton skeleton-title" style={{ width: '80%', marginTop: '8px' }}></div>
                <div className="skeleton skeleton-text" style={{ width: '95%', height: '14px' }}></div>
                <div className="skeleton skeleton-text" style={{ width: '75%', height: '14px', marginBottom: '24px' }}></div>
                <div className="skeleton skeleton-price"></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1, marginBottom: '24px' }}>
                  <div className="skeleton skeleton-text" style={{ width: '85%' }}></div>
                  <div className="skeleton skeleton-text" style={{ width: '70%' }}></div>
                  <div className="skeleton skeleton-text" style={{ width: '90%' }}></div>
                </div>
                <div className="skeleton skeleton-button"></div>
              </div>
            ))
          ) : (
            plans.map((p, index) => {
              const featuresList = typeof p.features === 'string'
                ? p.features.split(',')
                : (Array.isArray(p.features) ? p.features : []);

              // Database prices (99, 199, 349) are treated as Soles (PEN) by default.
              // Converted to USD dividing by 3.8.
              const displayPrice = currency === 'PEN'
                ? parseInt(p.price, 10)
                : Math.round(parseInt(p.price, 10) / 3.8);

              return (
                <motion.div 
                  key={p.id || index} 
                  variants={pricingCardVariants}
                  whileHover={{ y: -10, transition: { duration: 0.2 } }}
                >
                  <div className={`card price-card ${p.popular ? 'price-card-popular' : ''}`} style={{ height: '100%' }}>
                    {p.promo && <span className="price-promo-tag">{p.promo}</span>}
                    <h3 className="price-card-title">{p.title}</h3>
                    <p className="price-card-desc">{p.desc}</p>
                    
                    <div className="price-amount-box">
                      <span className="price-currency">{currency === 'PEN' ? 'S/' : '$'}</span>
                      <span 
                        className="price-counter"
                        data-target={displayPrice}
                      >
                        0
                      </span>
                      <span className="price-period">/ mes</span>
                    </div>

                    <ul className="price-features-list">
                      {featuresList.map((feat: string, fIndex: number) => (
                        <li key={fIndex} className="price-feature-item">
                          <span className="price-feature-item-icon">✓</span>
                          <span>{feat.trim()}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant={p.popular ? 'primary' : 'secondary'}
                      onClick={onStartLogin}
                      style={{ width: '100%' }}
                    >
                      Adquirir / Iniciar
                    </Button>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </section>

      {/* Dynamic client marquee */}
      <section className="landing-section" style={{ position: 'relative', zIndex: 10, padding: '60px 5%' }}>
        <div className="marquee-container" style={{ marginTop: '0px', background: 'transparent', border: 'none' }}>
          <div className="marquee-title" style={{ marginBottom: '16px', fontSize: '0.85rem' }}>Nuestros Clientes</div>
          <div className="marquee-track">
            {clients.length === 0 ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={`skeleton-client-${index}`} className="marquee-item" style={{ pointerEvents: 'none' }}>
                  <div className="skeleton skeleton-logo"></div>
                  <div className="skeleton skeleton-text" style={{ width: '110px', height: '18px', margin: 0 }}></div>
                </div>
              ))
            ) : (
              [...clients, ...clients, ...clients, ...clients, ...clients, ...clients].map((c, index) => (
                <div key={`${c.id}-${index}`} className="marquee-item">
                  <span style={{ fontSize: '2.2rem' }}>{c.logo}</span>
                  <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>{c.nombre}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer" style={{ position: 'relative', zIndex: 10 }}>
        <p className="landing-footer-text">
          © {new Date().getFullYear()} InfraSuite Inc. Todos los derechos reservados.
        </p>
        <p className="landing-footer-text" style={{ marginTop: '8px', fontSize: '0.75rem' }}>
          Tecnología de Autenticación Single Sign-On (SSO) y Sincronización Local SQLite/Firestore activa.
        </p>
      </footer>
    </div>
  );
};
export default LandingPage;
