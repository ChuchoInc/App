import React, { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './lib/firebase';
import { normalizeLiveQuestion, parseCSV } from './lib/csv';

function useCollectionByField(collectionName, field, value) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!value) return undefined;
    const q = query(collection(db, collectionName), where(field, '==', value));
    return onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    });
  }, [collectionName, field, value]);

  return items;
}

export function LiveActivitiesAdmin({ sessionId }) {
  const activities = useCollectionByField('activities', 'sessionId', sessionId);
  const [title, setTitle] = useState('Comprobación de lectura');

  async function createActivity() {
    const created = await addDoc(collection(db, 'activities'), {
      sessionId,
      title: title.trim() || 'Actividad en vivo',
      modality: 'individual',
      delivery: 'live',
      pace: 'teacher',
      status: 'draft',
      currentQuestionNumber: 1,
      revealResults: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setTitle('Comprobación de lectura');
    window.location.hash = `/admin?activity=${created.id}`;
  }

  return (
    <div className="block">
      <h2>Actividades en vivo · {sessionId}</h2>
      <p className="note">Cree una actividad, importe sus preguntas y comparta el enlace cuando esté lista.</p>
      <div className="actions compact">
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Nombre de la actividad" />
        <button onClick={createActivity}>Crear actividad</button>
      </div>
      {activities.length === 0 && <p>No hay actividades para esta sesión.</p>}
      {activities
        .sort((a, b) => String(a.title).localeCompare(String(b.title)))
        .map((activity) => <LiveActivityAdmin key={activity.id} activity={activity} />)}
    </div>
  );
}

function LiveActivityAdmin({ activity }) {
  const storedQuestions = useCollectionByField('questions', 'activityId', activity.id);
  const questions = [...storedQuestions].sort((a, b) => Number(a.number) - Number(b.number));
  const responses = useCollectionByField('liveResponses', 'activityId', activity.id);
  const answerKeys = useCollectionByField('answerKeys', 'activityId', activity.id);
  const [preview, setPreview] = useState([]);
  const currentQuestion = questions.find((item) => Number(item.number) === Number(activity.currentQuestionNumber));
  const currentResponses = responses.filter((item) => item.questionId === currentQuestion?.id);
  const currentKey = answerKeys.find((item) => item.questionId === currentQuestion?.id);

  async function updateActivity(changes) {
    await updateDoc(doc(db, 'activities', activity.id), { ...changes, updatedAt: serverTimestamp() });
  }

  async function handleQuestionsFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('En este primer corte use CSV. La lectura directa de Excel entra en el siguiente paso.');
      event.target.value = '';
      return;
    }
    const rows = parseCSV(await file.text()).map(normalizeLiveQuestion).filter((item) => item.prompt);
    setPreview(rows);
  }

  async function importQuestions() {
    await Promise.all(preview.map(async (item) => {
      const questionId = `${activity.id}_q_${item.number}`;
      await setDoc(doc(db, 'questions', questionId), {
        activityId: activity.id,
        sessionId: activity.sessionId,
        number: item.number,
        type: item.type,
        prompt: item.prompt,
        description: item.description,
        options: item.options,
        required: item.required,
        points: item.points,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      await setDoc(doc(db, 'answerKeys', questionId), {
        activityId: activity.id,
        questionId,
        correctAnswer: item.correctAnswer,
        explanation: item.explanation,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }));
    setPreview([]);
  }

  const hasAutomaticKey = String(currentKey?.correctAnswer || '').trim() !== '';
  const correctCount = hasAutomaticKey
    ? currentResponses.filter((response) => answersMatch(response.answer, currentKey.correctAnswer)).length
    : 0;
  const incorrectCount = hasAutomaticKey ? currentResponses.length - correctCount : 0;
  const pendingCount = hasAutomaticKey ? 0 : currentResponses.length;

  return (
    <details className="submission live-admin">
      <summary><strong>{activity.title}</strong> — {activity.status} — {questions.length} preguntas</summary>
      <div className="grid two">
        <label>Ritmo
          <select value={activity.pace} onChange={(event) => updateActivity({ pace: event.target.value })}>
            <option value="teacher">Guiada por el docente</option>
            <option value="self">Todas las preguntas</option>
          </select>
        </label>
        <label>Estado
          <select value={activity.status} onChange={(event) => updateActivity({ status: event.target.value })}>
            <option value="draft">Borrador</option>
            <option value="open">Abierta</option>
            <option value="closed">Cerrada</option>
          </select>
        </label>
      </div>
      <p><strong>Enlace:</strong> <a href={`#/actividad/${activity.id}`}>{`${window.location.origin}${window.location.pathname}#/actividad/${activity.id}`}</a></p>
      <label>Importar preguntas CSV
        <input type="file" accept=".csv,text/csv,.xlsx" onChange={handleQuestionsFile} />
      </label>
      <p className="note">Columnas: numero, tipo, pregunta, opciones, respuesta_correcta, retroalimentacion, puntaje, obligatorio. Separe opciones con |.</p>
      {preview.length > 0 && (
        <div className="preview-box">
          <strong>Vista previa: {preview.length} preguntas</strong>
          <ol>{preview.slice(0, 5).map((item) => <li key={item.number}>{item.prompt}</li>)}</ol>
          <button onClick={importQuestions}>Confirmar importación</button>
        </div>
      )}

      {activity.pace === 'teacher' && questions.length > 0 && (
        <div className="live-controls">
          <button className="secondary" disabled={activity.currentQuestionNumber <= 1} onClick={() => updateActivity({ currentQuestionNumber: activity.currentQuestionNumber - 1, revealResults: false })}>Anterior</button>
          <button onClick={() => updateActivity({ status: 'open' })}>Abrir respuestas</button>
          <button className="secondary" onClick={() => updateActivity({ status: 'closed' })}>Cerrar respuestas</button>
          <button disabled={activity.currentQuestionNumber >= questions.length} onClick={() => updateActivity({ currentQuestionNumber: activity.currentQuestionNumber + 1, status: 'open', revealResults: false })}>Siguiente</button>
        </div>
      )}

      {currentQuestion && (
        <div className="dashboard-box">
          <h3>{currentQuestion.number}. {currentQuestion.prompt}</h3>
          <p><strong>{currentResponses.length}</strong> respuestas · <strong>{correctCount}</strong> correctas · <strong>{incorrectCount}</strong> incorrectas{pendingCount > 0 ? ` · ${pendingCount} por revisar` : ''}</p>
          <button className="secondary" onClick={() => updateActivity({ revealResults: !activity.revealResults })}>
            {activity.revealResults ? 'Ocultar solución' : 'Revelar solución'}
          </button>
          {activity.revealResults && <p className="solution"><strong>Solución:</strong> {currentKey?.correctAnswer || 'Sin clave'}<br />{currentKey?.explanation}</p>}
          <div className="response-list">
            {currentResponses.map((response) => (
              <div key={response.id} className={!hasAutomaticKey ? 'response pending' : answersMatch(response.answer, currentKey?.correctAnswer) ? 'response correct' : 'response incorrect'}>
                <span>{response.responderName || response.responderEmail}</span>
                <strong>{String(response.answer)}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </details>
  );
}

export function LiveActivityPage({ activityId, user }) {
  const [activity, setActivity] = useState(null);
  const storedQuestions = useCollectionByField('questions', 'activityId', activityId);
  const questions = [...storedQuestions].sort((a, b) => Number(a.number) - Number(b.number));

  useEffect(() => onSnapshot(doc(db, 'activities', activityId), (snapshot) => {
    setActivity(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : false);
  }), [activityId]);

  if (!user) return <section className="card"><h1>Actividad en vivo</h1><p>Ingrese con Google para participar.</p></section>;
  if (activity === null) return <section className="card"><p>Cargando actividad…</p></section>;
  if (activity === false) return <section className="card"><p>La actividad no existe.</p></section>;
  if (activity.status === 'draft') return <section className="card"><h1>{activity.title}</h1><p>La actividad todavía no está abierta.</p></section>;

  const visibleQuestions = activity.pace === 'teacher'
    ? questions.filter((item) => Number(item.number) === Number(activity.currentQuestionNumber))
    : questions;

  return (
    <section className="card live-student">
      <p className="eyebrow">{activity.sessionId} · Actividad {activity.pace === 'teacher' ? 'guiada' : 'libre'}</p>
      <h1>{activity.title}</h1>
      {activity.status === 'closed' && <div className="info"><p>Las respuestas están cerradas. Espere la indicación del docente.</p></div>}
      {visibleQuestions.map((question) => (
        <LiveQuestion key={question.id} activity={activity} question={question} user={user} />
      ))}
      {visibleQuestions.length === 0 && <p>Espere a que el docente habilite una pregunta.</p>}
    </section>
  );
}

function LiveQuestion({ activity, question, user }) {
  const responseId = `${activity.id}_${user.uid}_${question.id}`;
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => onSnapshot(doc(db, 'liveResponses', responseId), (snapshot) => {
    setSubmitted(snapshot.exists() ? snapshot.data() : false);
  }), [responseId]);

  async function submit() {
    if (question.required && String(answer).trim() === '') return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'liveResponses', responseId), {
        activityId: activity.id,
        questionId: question.id,
        questionNumber: question.number,
        responderUid: user.uid,
        responderName: user.displayName || '',
        responderEmail: user.email || '',
        answer,
        submittedAt: serverTimestamp(),
      });
    } catch (error) {
      alert(`No fue posible registrar la respuesta: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (submitted === null) return <p>Cargando pregunta…</p>;
  if (submitted) {
    return (
      <div className="question submitted-answer">
        <strong>{question.number}. {question.prompt}</strong>
        <p>Respuesta registrada. Espere la indicación del docente.</p>
      </div>
    );
  }

  return (
    <div className="question">
      <h2>{question.number}. {question.prompt}</h2>
      {question.description && <p>{question.description}</p>}
      <QuestionInput question={question} answer={answer} setAnswer={setAnswer} />
      <button disabled={saving || activity.status !== 'open' || (question.required && !String(answer).trim())} onClick={submit}>Enviar respuesta</button>
    </div>
  );
}

function QuestionInput({ question, answer, setAnswer }) {
  if (question.type === 'choice' || question.type === 'seleccion') {
    return (
      <div className="choice-list">
        {(question.options || []).map((option) => (
          <label className="choice" key={option}>
            <input type="radio" name={`question-${question.id}`} value={option} checked={answer === option} onChange={(event) => setAnswer(event.target.value)} />
            <span>{option}</span>
          </label>
        ))}
      </div>
    );
  }
  if (question.type === 'true_false' || question.type === 'verdadero_falso') {
    return (
      <div className="choice-list">
        {['Verdadero', 'Falso'].map((option) => (
          <label className="choice" key={option}><input type="radio" name={`question-${question.id}`} value={option} checked={answer === option} onChange={(event) => setAnswer(event.target.value)} /><span>{option}</span></label>
        ))}
      </div>
    );
  }
  return <textarea rows={question.type === 'short' ? 2 : 5} value={answer} onChange={(event) => setAnswer(event.target.value)} />;
}

function answersMatch(answer, correctAnswer) {
  if (correctAnswer === undefined || correctAnswer === null || correctAnswer === '') return false;
  return String(answer).trim().toLocaleLowerCase() === String(correctAnswer).trim().toLocaleLowerCase();
}
