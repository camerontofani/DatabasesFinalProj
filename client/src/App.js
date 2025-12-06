import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import ViewAllData from './pages/ViewAllData';
import AddData from './pages/AddData';
import AddDegree from './pages/AddDegree';
import AddCourse from './pages/AddCourse';
import AddInstructor from './pages/AddInstructor';

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
      </Routes>
    </Router>
  );
}

export default App;

