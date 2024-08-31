// src/components/PrivateRoute.js

import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth'; // Asegúrate de usar la ruta correcta

const PrivateRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/" />;
};

export default PrivateRoute;
