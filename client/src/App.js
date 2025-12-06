import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import ViewAllData from './pages/ViewAllData';
import AddData from './pages/AddData';
import AddDegree from './pages/AddDegree';
import AddCourse from './pages/AddCourse';
import AddInstructor from './pages/AddInstructor';
import AddLearningObjective from './pages/AddLearningObjective';
import AddSemester from './pages/AddSemester';
import AddSection from './pages/AddSection';
import AddCourseObjective from './pages/AddCourseObjective';
import AddDegreeCourse from './pages/AddDegreeCourse';
import AddEvaluation from './pages/AddEvaluation';
import AddTeaches from './pages/AddTeaches';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/view" element={<ViewAllData />} />
        <Route path="/add" element={<AddData />} />
        <Route path="/add/degree" element={<AddDegree />} />
        <Route path="/add/course" element={<AddCourse />} />
        <Route path="/add/instructor" element={<AddInstructor />} />
        <Route path="/add/learning-objective" element={<AddLearningObjective />} />
        <Route path="/add/semester" element={<AddSemester />} />
        <Route path="/add/section" element={<AddSection />} />
        <Route path="/add/course-objective" element={<AddCourseObjective />} />
        <Route path="/add/degree-course" element={<AddDegreeCourse />} />
        <Route path="/add/teaches" element={<AddTeaches />} />
        <Route path="/add/evaluation" element={<AddEvaluation />} />
      </Routes>
    </Router>
  );
}

export default App;

