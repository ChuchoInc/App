import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, googleProvider, ADMIN_EMAIL, initAnalyticsSafely } from './lib/firebase';
import { parseCSV, normalizeQuestion } from './lib/csv';
import { LiveActivitiesAdmin, LiveActivityPage } from './LiveActivities';
import './styles.css';

const defaultSessionHtml = `
<section class="session-hero">
  <h1>S1: De la crisis del software a la Ingeniería de Software</h1>
  <p><strong>Pregunta guía:</strong> ¿Por qué fracasan los proyectos aunque haya buenos programadores?</p>
  <p>En esta sesión iniciaremos el proyecto integrador. La idea es comprender que programar no es suficiente: construir software exige método, comunicación, requisitos claros, diseño, pruebas y mantenimiento.</p>
</section>`;

function useAuthUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAnalyticsSafely();
    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        await setDoc(doc(db, 'users', currentUser.uid), {
          name: currentUser.displayName || '',
          email: currentUser.email || '',
          photoURL: currentUser.photoURL || '',
          lastLoginAt: serverTimestamp(),
        }, { merge: true });
      }
    });
  }, []);

  return { user, loading, isAdmin: user?.email === ADMIN_EMAIL };
}

function App() {
  const { user, loading, isAdmin } = useAuthUser();
  const [route, setRoute] = useState(() => window.location.hash.replace('#', '') || '/');

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash.replace('#', '') || '/');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (loading) return <main className="shell"><p>Cargando...</p></main>;

  return (
    <>
      <Header user={user} isAdmin={isAdmin} />
      <main className="shell">
        {route.startsWith('/admin') ? (
          <AdminPanel user={user} isAdmin={isAdmin} />
        ) : route.startsWith('/actividad/') ? (
          <LiveActivityPage activityId={route.split('/').pop()?.split('?')[0] || ''} user={user} />
        ) : route.startsWith('/sesion/') ? (
          <SessionPage sessionId={route.split('/').pop()?.toUpperCase() || 'S1'} user={user} />
        ) : (
          <Home user={user} />
        )}
      </main>
    </>
  );
}

function Header({ user, isAdmin }) {
  return (
    <header className="topbar">
      <a href="#/" className="brand">ChuchoIng • Ingeniería de Software</a>
      <nav>
        <a href="#/sesion/S1">S1</a>
        <a href="#/sesion/S2">S2</a>
        <a href="#/sesion/S3">S3</a>
        <a href="#/sesion/S4">S4</a>
        <a href="#/sesion/S5">S5</a>
        {isAdmin && <a href="#/admin">Panel docente</a>}
      </nav>
      <AuthButton user={user} />
    </header>
  );
}

function AuthButton({ user }) {
  if (!user) {
    return <button onClick={() => signInWithPopup(auth, googleProvider)}>Ingresar con Google</button>;
  }
  return (
    <div className="userbox">
      <span>{user.displayName || user.email}</span>
      <button className="secondary" onClick={() => signOut(auth)}>Salir</button>
    </div>
  );
}

function Home({ user }) {
  return (
    <section className="card hero">
      <h1>Ingeniería de Software 2026</h1>
      <p>Ruta de 5 sesiones para construir, paso a paso, un proyecto integrador de software.</p>
      <div className="grid five">
        {['S1', 'S2', 'S3', 'S4', 'S5'].map((s) => (
          <a className="session-tile" href={`#/sesion/${s}`} key={s}>{s}</a>
        ))}
      </div>
      {!user && <p className="note">La lectura puede ser pública. Para responder actividades debe iniciar sesión con Google.</p>}
    </section>
  );
}

function AdminPanel({ user, isAdmin }) {
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState('S1');

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'sessions'), orderBy('order'));
    return onSnapshot(q, (snap) => setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [isAdmin]);

  if (!user) return <LoginNotice />;
  if (!isAdmin) return <section className="card danger"><h2>Acceso restringido</h2><p>Este panel solo está habilitado para el docente administrador.</p></section>;

  const selectedSession = sessions.find((s) => s.id === selected);

  return (
    <div className="admin-layout">
      <aside className="card side">
        <h2>Panel docente</h2>
        <button onClick={seedBaseSessions}>Crear/actualizar sesiones base</button>
        <hr />
        {['S1', 'S2', 'S3', 'S4', 'S5'].map((s) => (
          <button key={s} className={selected === s ? 'active full' : 'secondary full'} onClick={() => setSelected(s)}>{s}</button>
        ))}
      </aside>
      <section className="card">
        <SessionEditor sessionId={selected} session={selectedSession} />
        <LiveActivitiesAdmin sessionId={selected} />
        <QuestionImporter sessionId={selected} />
        <SubmissionsAdmin sessionId={selected} />
      </section>
    </div>
  );
}

async function seedBaseSessions() {
  const items = [
    ['S1', 1, 'S1: Crisis del software', defaultSessionHtml],
    ['S2', 2, 'S2: Modelos de proceso de software', '<h1>S2: Modelos de proceso de software</h1><p>Contenido pendiente.</p>'],
    ['S3', 3, 'S3: Ingeniería de requisitos', '<h1>S3: Ingeniería de requisitos</h1><p>Contenido pendiente.</p>'],
    ['S4', 4, 'S4: Diseño, arquitectura, pruebas y calidad', '<h1>S4: Diseño, arquitectura, pruebas y calidad</h1><p>Contenido pendiente.</p>'],
    ['S5', 5, 'S5: Presentación del proyecto integrador', '<h1>S5: Presentación del proyecto integrador</h1><p>Contenido pendiente.</p>'],
  ];
  await Promise.all(items.map(([id, order, title, html]) => setDoc(doc(db, 'sessions', id), {
    order,
    title,
    html,
    published: id === 'S1',
    updatedAt: serverTimestamp(),
  }, { merge: true })));
  alert('Sesiones base creadas/actualizadas.');
}

function SessionEditor({ sessionId, session }) {
  const [title, setTitle] = useState('');
  const [html, setHtml] = useState('');
  const [published, setPublished] = useState(false);

  useEffect(() => {
    setTitle(session?.title || '');
    setHtml(session?.html || '');
    setPublished(Boolean(session?.published));
  }, [session?.id, session?.title, session?.html, session?.published]);

  async function save() {
    await setDoc(doc(db, 'sessions', sessionId), {
      order: Number(sessionId.replace('S', '')) || 99,
      title: title || sessionId,
      html: html || '<p>Contenido pendiente.</p>',
      published,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    alert('Sesión guardada.');
  }

  return (
    <div className="block">
      <h2>Contenido {sessionId}</h2>
      <label>Título</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título de la sesión" />
      <label>HTML de la sesión</label>
      <textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={12} placeholder="Pegar aquí el HTML de la sesión" />
      <label className="inline"><input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Publicar sesión</label>
      <button onClick={save}>Guardar sesión</button>
    </div>
  );
}

function QuestionImporter({ sessionId }) {
  const [questions, setQuestions] = useState([]);
  const [preview, setPreview] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'questions'), where('sessionId', '==', sessionId), orderBy('number'));
    return onSnapshot(q, (snap) => setQuestions(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [sessionId]);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setPreview(parseCSV(text).map(normalizeQuestion).filter((q) => q.prompt));
  }

  async function importPreview() {
    const batch = preview.map((q) => addDoc(collection(db, 'questions'), {
      ...q,
      sessionId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
    await Promise.all(batch);
    setPreview([]);
    alert('Preguntas importadas.');
  }

  return (
    <div className="block">
      <h2>Preguntas {sessionId}</h2>
      <p className="note">Importar CSV con columnas: sesion, numero, tipo, pregunta, descripcion, obligatorio, puntaje, criterio.</p>
      <input type="file" accept=".csv,text/csv" onChange={handleFile} />
      {preview.length > 0 && <button onClick={importPreview}>Importar {preview.length} preguntas</button>}
      <h3>Preguntas actuales</h3>
      <ol>
        {questions.map((q) => <li key={q.id}><strong>{q.number}.</strong> {q.prompt} <small>({q.points} pts)</small></li>)}
      </ol>
    </div>
  );
}

function SubmissionsAdmin({ sessionId }) {
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'submissions'), where('sessionId', '==', sessionId));
    return onSnapshot(q, (snap) => setSubmissions(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [sessionId]);

  async function saveGrade(id, grade, feedback) {
    await updateDoc(doc(db, 'submissions', id), { grade: Number(grade), feedback, gradedAt: serverTimestamp() });
  }

  function exportCsv() {
    const header = ['sessionId','groupName','leaderName','leaderEmail','ownerEmail','status','grade'];
    const lines = [header.join(',')].concat(submissions.map((s) => header.map((h) => JSON.stringify(s[h] ?? '')).join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `entregas_${sessionId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="block">
      <h2>Entregas {sessionId}</h2>
      <button className="secondary" onClick={exportCsv}>Exportar CSV</button>
      {submissions.map((s) => <SubmissionReview key={s.id} submission={s} onSave={saveGrade} />)}
    </div>
  );
}

function SubmissionReview({ submission, onSave }) {
  const [grade, setGrade] = useState(submission.grade ?? '');
  const [feedback, setFeedback] = useState(submission.feedback ?? '');
  return (
    <details className="submission">
      <summary><strong>{submission.groupName || 'Sin grupo'}</strong> — {submission.leaderName || submission.ownerEmail} — {submission.status}</summary>
      <h4>Integrantes</h4>
      <ul>
        {(submission.participants || []).map((p, i) => <li key={i}>{p.name} — {p.email} — {p.percent}% — {p.role}</li>)}
      </ul>
      <h4>Respuestas</h4>
      <ol>
        {Object.entries(submission.answers || {}).map(([k, v]) => <li key={k}><strong>{k}</strong>: {v}</li>)}
      </ol>
      <label>Nota</label>
      <input value={grade} onChange={(e) => setGrade(e.target.value)} />
      <label>Retroalimentación</label>
      <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} />
      <button onClick={() => onSave(submission.id, grade, feedback)}>Guardar nota</button>
    </details>
  );
}

function SessionPage({ sessionId, user }) {
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    return onSnapshot(doc(db, 'sessions', sessionId), (snap) => setSession(snap.exists() ? { id: snap.id, ...snap.data() } : null));
  }, [sessionId]);

  useEffect(() => {
    const q = query(collection(db, 'questions'), where('sessionId', '==', sessionId), orderBy('number'));
    return onSnapshot(q, (snap) => setQuestions(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [sessionId]);

  if (!session) return <section className="card"><h1>{sessionId}</h1><p>Sesión no disponible todavía.</p></section>;
  if (!session.published) return <section className="card"><h1>{session.title}</h1><p>Esta sesión aún no está publicada.</p></section>;

  return (
    <>
      <article className="session-content" dangerouslySetInnerHTML={{ __html: session.html }} />
      <section className="card">
        <h2>Actividad {sessionId}</h2>
        {!user ? <LoginNotice /> : <SubmissionForm sessionId={sessionId} questions={questions} user={user} />}
      </section>
    </>
  );
}

function LoginNotice() {
  return (
    <div className="info">
      <p>Para responder debe iniciar sesión con Google. Esto permite asociar la entrega con su correo y evitar entregas anónimas.</p>
      <button onClick={() => signInWithPopup(auth, googleProvider)}>Ingresar con Google</button>
    </div>
  );
}

function SubmissionForm({ sessionId, questions, user }) {
  const [groupName, setGroupName] = useState('');
  const [leaderName, setLeaderName] = useState(user.displayName || '');
  const [leaderEmail, setLeaderEmail] = useState(user.email || '');
  const [participants, setParticipants] = useState([{ name: user.displayName || '', email: user.email || '', role: 'Líder / entrega', percent: 100, observation: '' }]);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);

  const totalPercent = useMemo(() => participants.reduce((sum, p) => sum + Number(p.percent || 0), 0), [participants]);

  function updateParticipant(index, key, value) {
    setParticipants((items) => items.map((item, i) => i === index ? { ...item, [key]: value } : item));
  }

  async function save(status = 'submitted') {
    setSaving(true);
    try {
      await addDoc(collection(db, 'submissions'), {
        sessionId,
        groupName,
        leaderName,
        leaderEmail,
        ownerUid: user.uid,
        ownerEmail: user.email,
        participants,
        answers,
        status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      alert(status === 'draft' ? 'Borrador guardado.' : 'Entrega enviada.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="grid two">
        <label>Grupo<input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Grupo 1 / Individual" /></label>
        <label>Líder o responsable<input value={leaderName} onChange={(e) => setLeaderName(e.target.value)} /></label>
        <label>Correo líder<input value={leaderEmail} onChange={(e) => setLeaderEmail(e.target.value)} /></label>
      </div>
      <h3>Participación del grupo</h3>
      <p className="note">Registre nombres, correos, aporte y porcentaje. Si alguien tiene menos de 100%, explique en observación.</p>
      {participants.map((p, index) => (
        <div className="participant" key={index}>
          <input placeholder="Nombre" value={p.name} onChange={(e) => updateParticipant(index, 'name', e.target.value)} />
          <input placeholder="Correo" value={p.email} onChange={(e) => updateParticipant(index, 'email', e.target.value)} />
          <input placeholder="Aporte / rol" value={p.role} onChange={(e) => updateParticipant(index, 'role', e.target.value)} />
          <input type="number" min="0" max="100" placeholder="%" value={p.percent} onChange={(e) => updateParticipant(index, 'percent', e.target.value)} />
          <input placeholder="Observación" value={p.observation} onChange={(e) => updateParticipant(index, 'observation', e.target.value)} />
        </div>
      ))}
      <button className="secondary" onClick={() => setParticipants([...participants, { name: '', email: '', role: '', percent: 100, observation: '' }])}>Agregar integrante</button>
      <p className="note">Suma informativa de porcentajes: {totalPercent}%</p>
      <h3>Preguntas</h3>
      {questions.length === 0 && <p>No hay preguntas publicadas todavía.</p>}
      {questions.map((q) => (
        <label key={q.id} className="question">
          <strong>{q.number}. {q.prompt}</strong>
          {q.description && <span>{q.description}</span>}
          <textarea rows={5} required={q.required} value={answers[q.id] || ''} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
        </label>
      ))}
      <label className="inline"><input type="checkbox" required /> Confirmo que la participación registrada corresponde al aporte real de cada integrante.</label>
      <div className="actions">
        <button disabled={saving} className="secondary" onClick={() => save('draft')}>Guardar borrador</button>
        <button disabled={saving || questions.length === 0} onClick={() => save('submitted')}>Enviar actividad</button>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
