import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AddForm.css';
import './AddEvaluation.css';

export default function AddEvaluation() {
  // Step 1: Initial selections
  const [degree, setDegree] = useState('');
  const [semester, setSemester] = useState('');
  const [instructorId, setInstructorId] = useState('');
  
  // Step 2: Section selection
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  
  // Step 3: Objective selection and evaluation status
  const [objectives, setObjectives] = useState([]);
  const [evaluationStatus, setEvaluationStatus] = useState([]);
  const [selectedObjective, setSelectedObjective] = useState('');
  
  // Step 4: Evaluation form data
  const [evalMethod, setEvalMethod] = useState('');
  const [aNo, setANo] = useState('');
  const [bNo, setBNo] = useState('');
  const [cNo, setCNo] = useState('');
  const [fNo, setFNo] = useState('');
  const [improvementText, setImprovementText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // Dropdown data
  const [degrees, setDegrees] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [instructors, setInstructors] = useState([]);
  
  // Duplication feature
  const [otherDegrees, setOtherDegrees] = useState([]);
  const [duplicateTo, setDuplicateTo] = useState([]);
  
  // UI state
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch initial dropdown data
  useEffect(() => {
    async function fetchInitialData() {
      setLoadingData(true);
      try {
        const [degreesRes, semestersRes, instructorsRes] = await Promise.all([
          fetch('http://localhost:4000/api/degrees'),
          fetch('http://localhost:4000/api/semesters'),
          fetch('http://localhost:4000/api/instructors')
        ]);
        setDegrees(await degreesRes.json());
        setSemesters(await semestersRes.json());
        setInstructors(await instructorsRes.json());
      } catch (err) {
        setError('Could not load data. Please make sure the backend is running.');
      }
      setLoadingData(false);
    }
    fetchInitialData();
  }, []);

  // Fetch sections when degree, semester, and instructor are selected
  useEffect(() => {
    if (!degree || !semester || !instructorId) {
      setSections([]);
      return;
    }
    async function fetchSections() {
      setLoading(true);
      setError('');
      try {
        const [degreeName, degreeLevel] = degree.split('|');
        const [term, year] = semester.split('|');
        const response = await fetch(
          `http://localhost:4000/api/instructor-sections?degree_name=${encodeURIComponent(degreeName)}&degree_level=${encodeURIComponent(degreeLevel)}&term=${encodeURIComponent(term)}&year=${encodeURIComponent(year)}&instructor_id=${encodeURIComponent(instructorId)}`
        );
        const data = await response.json();
        setSections(data);
        if (data.length === 0) {
          setError('No sections found for this instructor in this semester for courses in this degree.');
        }
      } catch (err) {
        setError('Could not load sections.');
      }
      setLoading(false);
    }
    fetchSections();
  }, [degree, semester, instructorId]);

  // Fetch objectives and evaluation status when section is selected
  useEffect(() => {
    if (!selectedSection || !degree) {
      setObjectives([]);
      setEvaluationStatus([]);
      return;
    }
    async function fetchObjectivesAndStatus() {
      setLoading(true);
      try {
        const [courseNo, sectionNo, term, year] = selectedSection.split('|');
        const [degreeName, degreeLevel] = degree.split('|');
        
        // Fetch course objectives (what the course teaches)
        const courseObjResponse = await fetch(`http://localhost:4000/api/course-objectives?course_no=${encodeURIComponent(courseNo)}`);
        const courseObjData = await courseObjResponse.json();
        
        // Fetch degree objectives (what the degree cares about)
        const degreeObjResponse = await fetch(`http://localhost:4000/api/degree-objectives?degree_name=${encodeURIComponent(degreeName)}&degree_level=${encodeURIComponent(degreeLevel)}`);
        const degreeObjData = await degreeObjResponse.json();
        const degreeObjCodes = degreeObjData.map(d => d.objective_code);
        
        // If degree has no objectives defined, show all course objectives (backwards compatibility)
        // Otherwise, show only the INTERSECTION (objectives that are in BOTH)
        let filteredObjectives;
        if (degreeObjCodes.length === 0) {
          // No degree objectives defined - show all course objectives
          filteredObjectives = courseObjData;
        } else {
          // Show only objectives that the degree cares about AND the course teaches
          filteredObjectives = courseObjData.filter(obj => degreeObjCodes.includes(obj.objective_code));
        }
        setObjectives(filteredObjectives);
        
        // If intersection is empty but both have objectives, show a warning
        if (degreeObjCodes.length > 0 && courseObjData.length > 0 && filteredObjectives.length === 0) {
          setError('No matching objectives: This course teaches objectives that are not part of this degree\'s objectives.');
        }
        
        const evalResponse = await fetch(`http://localhost:4000/api/section-evaluations?degree_name=${encodeURIComponent(degreeName)}&degree_level=${encodeURIComponent(degreeLevel)}&course_no=${encodeURIComponent(courseNo)}&section_no=${encodeURIComponent(sectionNo)}&term=${encodeURIComponent(term)}&year=${encodeURIComponent(year)}`);
        const evalData = await evalResponse.json();
        setEvaluationStatus(evalData);
        
        const otherDegResponse = await fetch(`http://localhost:4000/api/course-degrees?course_no=${encodeURIComponent(courseNo)}`);
        const otherDegData = await otherDegResponse.json();
        setOtherDegrees(otherDegData.filter(d => !(d.degree_name === degreeName && d.degree_level === degreeLevel)));
      } catch (err) {
        setError('Could not load objectives.');
      }
      setLoading(false);
    }
    fetchObjectivesAndStatus();
  }, [selectedSection, degree]);

  // Load existing evaluation data when objective is selected
  useEffect(() => {
    if (!selectedObjective) {
      resetForm();
      return;
    }
    const existing = evaluationStatus.find(e => e.objective_code === selectedObjective);
    if (existing) {
      setEvalMethod(existing.eval_method || '');
      setANo(existing.a_no?.toString() || '');
      setBNo(existing.b_no?.toString() || '');
      setCNo(existing.c_no?.toString() || '');
      setFNo(existing.f_no?.toString() || '');
      setImprovementText(existing.improvement_text || '');
      setIsEditing(true);
    } else {
      resetForm();
      setIsEditing(false);
    }
  }, [selectedObjective, evaluationStatus]);

  const resetForm = () => {
    setEvalMethod('');
    setANo('');
    setBNo('');
    setCNo('');
    setFNo('');
    setImprovementText('');
    setDuplicateTo([]);
  };

  const handleStep1Continue = () => {
    if (!degree || !semester || !instructorId) {
      setError('Please select degree, semester, and instructor.');
      return;
    }
    if (sections.length === 0) {
      setError('No sections found. Please check your selections.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleStep2Continue = () => {
    if (!selectedSection) {
      setError('Please select a section.');
      return;
    }
    setError('');
    setStep(3);
  };

  const validateNumbers = () => {
    const nums = [aNo, bNo, cNo, fNo];
    for (const n of nums) {
      if (n === '' || n === null || n === undefined) return 'All grade counts are required.';
      const parsed = parseInt(n, 10);
      if (isNaN(parsed) || parsed < 0) return 'Grade counts must be non-negative whole numbers.';
      if (parsed > 9999) return 'Grade counts seem unreasonably large.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!selectedObjective) { setError('Please select a learning objective.'); return; }
    if (!evalMethod.trim()) { setError('Evaluation method is required.'); return; }
    const numError = validateNumbers();
    if (numError) { setError(numError); return; }

    setLoading(true);
    try {
      const [degreeName, degreeLevel] = degree.split('|');
      const [courseNo, sectionNo, term, year] = selectedSection.split('|');
      const payload = {
        degree_name: degreeName, degree_level: degreeLevel,
        course_no: courseNo, section_no: sectionNo, term, year: parseInt(year, 10),
        objective_code: selectedObjective, eval_method: evalMethod.trim(),
        a_no: parseInt(aNo, 10), b_no: parseInt(bNo, 10), c_no: parseInt(cNo, 10), f_no: parseInt(fNo, 10),
        improvement_text: improvementText.trim() || null, duplicate_to: duplicateTo
      };
      const url = isEditing ? 'http://localhost:4000/api/evaluations/update' : 'http://localhost:4000/api/evaluations';
      const response = await fetch(url, { method: isEditing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Failed to save evaluation.'); return; }

      let msg = `Evaluation ${isEditing ? 'updated' : 'added'} successfully!`;
      if (duplicateTo.length > 0) msg += ` Duplicated to ${duplicateTo.length} other degree(s).`;
      setSuccess(msg);
      
      // Refresh evaluation status
      const evalResponse = await fetch(`http://localhost:4000/api/section-evaluations?degree_name=${encodeURIComponent(degreeName)}&degree_level=${encodeURIComponent(degreeLevel)}&course_no=${encodeURIComponent(courseNo)}&section_no=${encodeURIComponent(sectionNo)}&term=${encodeURIComponent(term)}&year=${encodeURIComponent(year)}`);
      setEvaluationStatus(await evalResponse.json());
      setDuplicateTo([]);
    } catch (err) {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateToggle = (degreeKey) => {
    setDuplicateTo(prev => prev.includes(degreeKey) ? prev.filter(d => d !== degreeKey) : [...prev, degreeKey]);
  };

  const getObjectiveStatus = (objCode) => evaluationStatus.find(e => e.objective_code === objCode) ? 'completed' : 'pending';
  const getCompletionStats = () => ({ total: objectives.length, completed: evaluationStatus.length, pending: objectives.length - evaluationStatus.length });

  // Get selected section's student count for soft warning
  const getSelectedSectionStudentCount = () => {
    if (!selectedSection) return null;
    const [courseNo, sectionNo, term, year] = selectedSection.split('|');
    const sec = sections.find(s => 
      s.course_no === courseNo && 
      s.section_no === sectionNo && 
      s.term === term && 
      s.year === parseInt(year, 10)
    );
    return sec ? sec.student_count : null;
  };

  // Calculate sum of grades for soft warning
  const getGradeSum = () => {
    const a = parseInt(aNo, 10) || 0;
    const b = parseInt(bNo, 10) || 0;
    const c = parseInt(cNo, 10) || 0;
    const f = parseInt(fNo, 10) || 0;
    return a + b + c + f;
  };

  const studentCount = getSelectedSectionStudentCount();
  const gradeSum = getGradeSum();
  const showGradeWarning = studentCount && gradeSum > 0 && gradeSum > studentCount;

  if (loadingData) return <div className="form-container"><div className="form-header"><h1>Loading...</h1></div></div>;

  return (
    <div className="form-container evaluation-container">
      <Link to="/add" className="back-button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back to Add Data
      </Link>
      <div className="form-header"><h1>Enter Evaluation</h1><p className="subtitle">Record student performance for learning objectives</p></div>

      <div className="step-indicator">
        <div className={`step ${step >= 1 ? 'active' : ''}`}><span className="step-number">1</span><span className="step-label">Select Context</span></div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}><span className="step-number">2</span><span className="step-label">Select Section</span></div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}><span className="step-number">3</span><span className="step-label">Enter Data</span></div>
      </div>

      {error && <div className="message error-message"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>{error}</div>}
      {success && <div className="message success-message"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>{success}</div>}

      {step === 1 && (
        <div className="data-form">
          <div className="form-group"><label>Degree Program <span className="required">*</span></label>
            <select value={degree} onChange={(e) => { setDegree(e.target.value); setSelectedSection(''); setSelectedObjective(''); }}>
              <option value="">-- Select Degree --</option>
              {degrees.map((d) => <option key={`${d.name}|${d.level}`} value={`${d.name}|${d.level}`}>{d.name} ({d.level})</option>)}
            </select>
          </div>
          <div className="form-group"><label>Semester <span className="required">*</span></label>
            <select value={semester} onChange={(e) => { setSemester(e.target.value); setSelectedSection(''); setSelectedObjective(''); }}>
              <option value="">-- Select Semester --</option>
              {semesters.map((s) => <option key={`${s.term}|${s.year}`} value={`${s.term}|${s.year}`}>{s.term} {s.year}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Instructor <span className="required">*</span></label>
            <select value={instructorId} onChange={(e) => { setInstructorId(e.target.value); setSelectedSection(''); setSelectedObjective(''); }}>
              <option value="">-- Select Instructor --</option>
              {instructors.map((i) => <option key={i.instructor_id} value={i.instructor_id}>{i.instructor_name}</option>)}
            </select>
          </div>
          {sections.length > 0 && <div className="sections-preview"><p><strong>{sections.length}</strong> section(s) found.</p></div>}
          <div className="form-actions"><button type="button" className="submit-btn" onClick={handleStep1Continue} disabled={loading || sections.length === 0}>Continue</button></div>
        </div>
      )}

      {step === 2 && (
        <div className="data-form">
          <button type="button" className="back-step-btn" onClick={() => setStep(1)}>← Back</button>
          <div className="context-summary"><p><strong>Degree:</strong> {degree.replace('|', ' ')}</p><p><strong>Semester:</strong> {semester.replace('|', ' ')}</p><p><strong>Instructor:</strong> {instructors.find(i => i.instructor_id === parseInt(instructorId))?.instructor_name}</p></div>
          <div className="form-group"><label>Select Section <span className="required">*</span></label>
            <div className="section-cards">
              {sections.map((sec) => {
                const key = `${sec.course_no}|${sec.section_no}|${sec.term}|${sec.year}`;
                return <div key={key} className={`section-card ${selectedSection === key ? 'selected' : ''}`} onClick={() => setSelectedSection(key)}><div className="section-course">{sec.course_no}</div><div className="section-name">{sec.course_name}</div><div className="section-details">Section {sec.section_no} • {sec.student_count} students</div></div>;
              })}
            </div>
          </div>
          <div className="form-actions"><button type="button" className="submit-btn" onClick={handleStep2Continue} disabled={!selectedSection}>Continue</button></div>
        </div>
      )}

      {step === 3 && (
        <form onSubmit={handleSubmit} className="data-form">
          <button type="button" className="back-step-btn" onClick={() => { setStep(2); setSelectedObjective(''); }}>← Back</button>
          {objectives.length > 0 && <div className="completion-status"><h3>Progress</h3><div className="progress-bar"><div className="progress-fill" style={{ width: `${(getCompletionStats().completed / getCompletionStats().total) * 100}%` }} /></div><p><span className="completed-count">{getCompletionStats().completed}</span> of <span className="total-count">{getCompletionStats().total}</span> objectives evaluated</p></div>}
          <div className="form-group"><label>Learning Objective <span className="required">*</span></label>
            <div className="objective-list">
              {objectives.map((obj) => <div key={obj.objective_code} className={`objective-item ${selectedObjective === obj.objective_code ? 'selected' : ''} ${getObjectiveStatus(obj.objective_code)}`} onClick={() => setSelectedObjective(obj.objective_code)}><div className="objective-header"><span className="objective-code">{obj.objective_code}</span><span className={`status-badge ${getObjectiveStatus(obj.objective_code)}`}>{getObjectiveStatus(obj.objective_code) === 'completed' ? '✓ Entered' : '○ Pending'}</span></div><div className="objective-title">{obj.title}</div></div>)}
            </div>
          </div>
          {selectedObjective && (
            <div className="evaluation-form-section">
              <h3>{isEditing ? 'Edit' : 'New'} Evaluation for {selectedObjective}</h3>
              <div className="form-group"><label>Evaluation Method <span className="required">*</span></label><input type="text" value={evalMethod} onChange={(e) => setEvalMethod(e.target.value)} placeholder="e.g., Final Exam, Project" /></div>
              <div className="grade-inputs">
                <div className="form-group grade-input"><label>A <span className="required">*</span></label><input type="number" value={aNo} onChange={(e) => setANo(e.target.value)} min="0" /></div>
                <div className="form-group grade-input"><label>B <span className="required">*</span></label><input type="number" value={bNo} onChange={(e) => setBNo(e.target.value)} min="0" /></div>
                <div className="form-group grade-input"><label>C <span className="required">*</span></label><input type="number" value={cNo} onChange={(e) => setCNo(e.target.value)} min="0" /></div>
                <div className="form-group grade-input"><label>F <span className="required">*</span></label><input type="number" value={fNo} onChange={(e) => setFNo(e.target.value)} min="0" /></div>
              </div>
              {gradeSum > 0 && studentCount && (
                <div className={`grade-sum-info ${showGradeWarning ? 'warning' : ''}`}>
                  <span>Total: <strong>{gradeSum}</strong> students graded</span>
                  <span className="separator">|</span>
                  <span>Section size: <strong>{studentCount}</strong></span>
                  {showGradeWarning && (
                    <div className="grade-warning">
                      Warning: Grade total ({gradeSum}) exceeds section size ({studentCount}). 
                      You cannot grade more students than are enrolled in the section.
                    </div>
                  )}
                </div>
              )}
              <div className="form-group"><label>Improvement Notes (Optional)</label><textarea value={improvementText} onChange={(e) => setImprovementText(e.target.value)} placeholder="Suggestions for improvement..." rows="3" /></div>
              {otherDegrees.length > 0 && !isEditing && <div className="duplication-section"><h4>Duplicate to Other Degrees?</h4><p className="help-text">This course belongs to multiple degrees:</p><div className="duplicate-options">{otherDegrees.map((d) => { const key = `${d.degree_name}|${d.degree_level}`; return <label key={key} className="duplicate-option"><input type="checkbox" checked={duplicateTo.includes(key)} onChange={() => handleDuplicateToggle(key)} />{d.degree_name} ({d.degree_level})</label>; })}</div></div>}
              <div className="form-actions"><button type="submit" className="submit-btn" disabled={loading}>{loading ? 'Saving...' : (isEditing ? 'Update' : 'Save')}</button><button type="button" className="secondary-btn" onClick={() => setSelectedObjective('')} disabled={loading}>Cancel</button></div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}

