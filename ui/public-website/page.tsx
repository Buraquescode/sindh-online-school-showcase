'use client';
import { useLanguage } from '@/context/language-context';
import FeaturedVideos from '@/components/home/featured-videos';
import ClassGrid from '@/components/home/class-grid';
import OtherSections from '@/components/home/other-sections';
import { BookOpen, Users, Video, Sparkles, ArrowRight, Star, Zap, Shield } from 'lucide-react';

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#F0F2FF' }}>

      {/* ══════════════════════════════════════════
          HERO — Full-bleed cinematic banner
      ══════════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(135deg, #0D1257 0%, #1A237E 45%, #283593 75%, #1565C0 100%)',
        minHeight: 520,
        padding: '72px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Dot-grid texture overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        {/* Glow blobs */}
        <div style={{ position:'absolute', top:-120, right:-120, width:480, height:480, borderRadius:'50%', background:'rgba(0,188,212,0.14)', filter:'blur(60px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-80, left:'20%', width:340, height:340, borderRadius:'50%', background:'rgba(255,171,0,0.10)', filter:'blur(50px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:'40%', left:'-5%', width:200, height:200, borderRadius:'50%', background:'rgba(57,73,171,0.25)', filter:'blur(40px)', pointerEvents:'none' }} />

        {/* Decorative ring */}
        <div style={{
          position:'absolute', right:'8%', top:'50%', transform:'translateY(-50%)',
          width:320, height:320, borderRadius:'50%',
          border:'1px solid rgba(0,188,212,0.18)',
          pointerEvents:'none',
        }} />
        <div style={{
          position:'absolute', right:'12%', top:'50%', transform:'translateY(-50%)',
          width:220, height:220, borderRadius:'50%',
          border:'1px solid rgba(0,188,212,0.12)',
          pointerEvents:'none',
        }} />

        <div style={{ maxWidth:1280, margin:'0 auto', position:'relative' }}>
          {/* Badge */}
          <div style={{
            display:'inline-flex', alignItems:'center', gap:8,
            background:'rgba(0,188,212,0.15)',
            border:'1px solid rgba(0,188,212,0.40)',
            borderRadius:40, padding:'6px 16px', marginBottom:28,
          }}>
            <Sparkles style={{ width:13, height:13, color:'#80DEEA' }} />
            <span style={{ fontSize:12, color:'#80DEEA', fontWeight:700, letterSpacing:'0.05em' }}>
              {t('FREE EDUCATION FOR ALL', 'سڀني لاءِ مفت تعليم')}
            </span>
          </div>

          {/* Main heading — giant display type */}
          <h1 style={{
            fontSize:'clamp(38px, 6vw, 76px)',
            fontWeight:800,
            color:'white',
            lineHeight:1.06,
            marginBottom:8,
            letterSpacing:'-0.02em',
            maxWidth:700,
          }}>
            {t('Sindh', 'سنڌ')}
          </h1>
          <h1 style={{
            fontSize:'clamp(38px, 6vw, 76px)',
            fontWeight:800,
            lineHeight:1.06,
            marginBottom:24,
            letterSpacing:'-0.02em',
            maxWidth:700,
            background:'linear-gradient(90deg, #80DEEA 0%, #00BCD4 40%, #FFAB00 100%)',
            WebkitBackgroundClip:'text',
            WebkitTextFillColor:'transparent',
            backgroundClip:'text',
          }}>
            {t('Online School', 'آن لائن اسڪول')}
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize:'clamp(15px, 1.6vw, 18px)',
            color:'rgba(255,255,255,0.68)',
            marginBottom:44,
            maxWidth:460,
            lineHeight:1.75,
            fontWeight:400,
          }}>
            {t(
              'Bringing world-class free video lectures to every child in Sindh. STBB syllabus — Classes 1 through 10.',
              'سنڌ جي هر ٻار لاءِ مفت وڊيو ليڪچر. ايس ٽي بي بي نصاب — ڪلاس 1 کان 10.'
            )}
          </p>

          {/* CTA + Stats row */}
          <div style={{ display:'flex', alignItems:'center', gap:32, flexWrap:'wrap', marginBottom:56 }}>
            <a href="#classes" style={{
              display:'inline-flex', alignItems:'center', gap:8,
              background:'linear-gradient(135deg, #00BCD4, #00838F)',
              color:'white', fontWeight:700, fontSize:15,
              borderRadius:14, padding:'14px 28px',
              textDecoration:'none', transition:'all 0.2s',
              boxShadow:'0 8px 24px rgba(0,188,212,0.35)',
            }}>
              {t('Start Learning', 'سکڻ شروع ڪريو')}
              <ArrowRight style={{ width:16, height:16 }} />
            </a>
            <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
              {[
                { icon: BookOpen, val:'10+', lbl: t('Classes','ڪلاس') },
                { icon: Users,    val:'50+', lbl: t('Subjects','مضمون') },
                { icon: Video,    val:'200+',lbl: t('Videos','وڊيوز') },
              ].map(({ icon: Icon, val, lbl }) => (
                <div key={lbl} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{
                    width:38, height:38, borderRadius:11,
                    background:'rgba(255,255,255,0.10)',
                    border:'1px solid rgba(255,255,255,0.15)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <Icon style={{ width:17, height:17, color:'#80DEEA' }} />
                  </div>
                  <div>
                    <div style={{ fontSize:20, fontWeight:800, color:'white', lineHeight:1.1 }}>{val}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)', fontWeight:500 }}>{lbl}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trust strip */}
          <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
            {[
              { icon: Star,   text: t('100% Free','مڪمل مفت') },
              { icon: Zap,    text: t('STBB Aligned','ايس ٽي بي بي') },
              { icon: Shield, text: t('Safe for Kids','ٻارن لاءِ محفوظ') },
            ].map(({ icon: Icon, text }) => (
              <div key={text} style={{
                display:'flex', alignItems:'center', gap:6,
                background:'rgba(255,255,255,0.07)',
                border:'1px solid rgba(255,255,255,0.12)',
                borderRadius:20, padding:'5px 12px',
              }}>
                <Icon style={{ width:12, height:12, color:'#FFAB00' }} />
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.75)', fontWeight:500 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          MARQUEE TICKER
      ══════════════════════════════════════════ */}
      <div style={{
        background:'#1A237E', overflow:'hidden', padding:'12px 0',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          display:'flex', gap:48, whiteSpace:'nowrap',
          animation:'marquee 28s linear infinite',
        }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ display:'flex', gap:48, flexShrink:0 }}>
              {['Class One','Class Two','Class Three','English Grammar','Math Basics','Science','MS Office','Sindhi','Social Studies'].map(item => (
                <span key={item} style={{ fontSize:13, color:'rgba(255,255,255,0.55)', fontWeight:500, display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ width:4, height:4, borderRadius:'50%', background:'#00BCD4', display:'inline-block', flexShrink:0 }} />
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
        <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-33.33%) } }`}</style>
      </div>

      {/* ══════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════ */}
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'60px 24px 40px' }}>

        {/* ── Featured Videos ─── */}
        <div style={{ marginBottom:72 }}>
          <SectionLabel eyebrow="Featured" color="#00838F" />
          <SectionTitle title={t('Featured Videos','نمايان وڊيوز')} borderColor="#00BCD4" />
          <FeaturedVideos />
        </div>

        {/* ── Classes ─── */}
        <div id="classes" style={{ marginBottom:72, scrollMarginTop:80 }}>
          <SectionLabel eyebrow={t('STBB Syllabus','ايس ٽي بي بي نصاب')} color="#00838F" />
          <SectionTitle
            title={t('Video Lectures by Class','ڪلاس مطابق وڊيو ليڪچر')}
            subtitle={t('Select your class to explore subjects and start watching free lessons.','پنهنجو ڪلاس چونڊيو ۽ مفت سبق ڏسڻ شروع ڪريو.')}
            borderColor="#00BCD4"
          />
          <ClassGrid />
        </div>

        {/* ── Other Sections ─── */}
        <div style={{ marginBottom:40 }}>
          <SectionLabel eyebrow={t('More Content','وڌيڪ مواد')} color="#B45309" />
          <SectionTitle
            title={t('Other Sections','ٻيا حصا')}
            subtitle={t('Explore additional learning resources beyond the main syllabus.','مکيه نصاب کان ٻاهر اضافي سکيا جا وسيلا ڳوليو.')}
            borderColor="#FFAB00"
          />
          <OtherSections />
        </div>
      </div>

      {/* ══════════════════════════════════════════
          CALL TO ACTION BAND
      ══════════════════════════════════════════ */}
      <section style={{
        background:'linear-gradient(135deg, #0D1257 0%, #1A237E 60%, #00838F 100%)',
        padding:'64px 24px',
        textAlign:'center',
        position:'relative',
        overflow:'hidden',
      }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize:'24px 24px', pointerEvents:'none' }} />
        <div style={{ position:'relative', maxWidth:600, margin:'0 auto' }}>
          <div style={{
            display:'inline-block', background:'rgba(255,171,0,0.15)', border:'1px solid rgba(255,171,0,0.35)',
            borderRadius:40, padding:'5px 16px', marginBottom:20,
          }}>
            <span style={{ fontSize:12, color:'#FFD740', fontWeight:700, letterSpacing:'0.06em' }}>
              {t('JOIN TODAY','اڄ شامل ٿيو')}
            </span>
          </div>
          <h2 style={{
            fontSize:'clamp(26px, 4vw, 44px)', fontWeight:800, color:'white',
            lineHeight:1.15, marginBottom:16, letterSpacing:'-0.02em',
          }}>
            {t('Learning is free. Always.', 'سکڻ مفت آهي. هميشه.')}
          </h2>
          <p style={{ fontSize:16, color:'rgba(255,255,255,0.65)', marginBottom:32, lineHeight:1.7 }}>
            {t(
              'Download our mobile app and access all classes, subjects, and videos anywhere, anytime.',
              'اسان جي موبائل ايپ ڊائونلوڊ ڪريو ۽ سڀ ڪلاس، مضمون ۽ وڊيوز ڪٿي به، ڪڏهن به استعمال ڪريو.'
            )}
          </p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <a href="#" style={{
              background:'white', color:'#1A237E', fontWeight:700, fontSize:14,
              borderRadius:12, padding:'13px 24px', textDecoration:'none',
              display:'inline-flex', alignItems:'center', gap:8,
            }}>
              📱 {t('Get Mobile App','موبائل ايپ حاصل ڪريو')}
            </a>
            <a href="/about" style={{
              background:'rgba(255,255,255,0.12)', color:'white', fontWeight:600, fontSize:14,
              borderRadius:12, padding:'13px 24px', textDecoration:'none',
              border:'1px solid rgba(255,255,255,0.20)',
              display:'inline-flex', alignItems:'center', gap:8,
            }}>
              {t('Learn More','وڌيڪ ڄاڻو')} <ArrowRight style={{ width:15, height:15 }} />
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}

/* ── Shared typography helpers ── */
function SectionLabel({ eyebrow, color }: { eyebrow: string; color: string }) {
  return (
    <p style={{
      fontSize:11, fontWeight:800,
      color, letterSpacing:'0.12em',
      textTransform:'uppercase', marginBottom:8,
    }}>
      {eyebrow}
    </p>
  );
}

function SectionTitle({
  title, subtitle, borderColor,
}: {
  title: string;
  subtitle?: string;
  borderColor: string;
}) {
  return (
    <div style={{ marginBottom:28 }}>
      <h2 style={{
        fontSize:'clamp(22px, 3vw, 32px)',
        fontWeight:800,
        color:'#0D1257',
        paddingLeft:16,
        borderLeft:`4px solid ${borderColor}`,
        letterSpacing:'-0.01em',
        lineHeight:1.2,
        marginBottom: subtitle ? 10 : 0,
      }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{
          fontSize:15, color:'#5C6080', lineHeight:1.65,
          paddingLeft:20, maxWidth:560, marginTop:8,
        }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}