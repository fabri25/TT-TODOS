import React, { useState } from 'react';
import '../styles/CoursesCatalog.css'; // Archivo CSS para estilos personalizados
import curso1 from '../assets/images/curso1.jpg';
import curso2 from '../assets/images/curso2.jpg';
import curso3 from '../assets/images/curso3.jpg';
import curso4 from '../assets/images/curso4.jpg';
import curso5 from '../assets/images/curso5.jpg';
import curso6 from '../assets/images/curso6.jpg';
import curso7 from '../assets/images/curso7.jpg';
import curso8 from '../assets/images/curso8.jpg';
import curso9 from '../assets/images/curso9.jpg';
import curso10 from '../assets/images/curso10.jpg';
import curso11 from '../assets/images/curso11.jpg';
import curso12 from '../assets/images/curso12.jpg';
import curso13 from '../assets/images/curso13.jpg';
import curso14 from '../assets/images/curso14.jpg';

const CoursesCatalog = () => {
  // Lista de cursos con sus detalles
  const courses = [
    {
        id: 1,
        name: 'Educación Financiera - Afore',
        image: curso5,
        link: 'https://www.banamex.com/sitios/educacion-financiera/cursos-de-educacion-financiera/curso-educacion-financiera.html?curso=1096',
        owner: 'Banamex',
        categories: ['Banamex', 'Gratis'],
      },
      {
        id: 2,
        name: 'Educación Financiera - Controla tus deudas',
        image: curso6,
        link: 'https://www.banamex.com/sitios/educacion-financiera/cursos-de-educacion-financiera/curso-educacion-financiera.html?curso=1097',
        owner: 'Banamex',
        categories: ['Banamex', 'Gratis'],
      },
      {
        id: 3,
        name: 'Educación Financiera - Crédito Hipotecario',
        image: curso7,
        link: 'https://www.banamex.com/sitios/educacion-financiera/cursos-de-educacion-financiera/curso-educacion-financiera.html?curso=1095',
        owner: 'Banamex',
        categories: ['Banamex', 'Gratis'],
      },
      {
        id: 4,
        name: 'Educación Financiera - Finanzas personales',
        image: curso8,
        link: 'https://www.banamex.com/sitios/educacion-financiera/cursos-de-educacion-financiera/curso-educacion-financiera.html?curso=1179',
        owner: 'Banamex',
        categories: ['Banamex', 'Gratis'],
      },
      {
        id: 5,
        name: 'Educación Financiera - Inversiones',
        image: curso9,
        link: 'https://www.banamex.com/sitios/educacion-financiera/cursos-de-educacion-financiera/curso-educacion-financiera.html?curso=1094',
        owner: 'Banamex',
        categories: ['Banamex', 'Gratis'],
      },
    {
      id: 6,
      name: 'Educación Financiera para Principiantes - Esto es lo PRIMERO que debes saber',
      image: curso1,
      link: 'https://www.youtube.com/watch?v=9sCVcWD1Svs',
      owner: 'Better Wallet en Español',
      categories: ['Gratis', 'Videos'],
    },
    {
      id: 7,
      name: '✅15 Lecciones PODEROSAS de EDUCACIÓN FINANCIERA y FINANZAS PERSONALES',
      image: curso2,
      link: 'https://www.youtube.com/watch?v=J1cWzzRNyE8',
      owner: 'ADN Financiero',
      categories: ['Gratis', 'Videos'],
    },
    {
      id: 8,
      name: 'Diplomado en Educación Financiera',
      image: curso3,
      link: 'https://inscripcion-diplomado.condusef.gob.mx/',
      owner: 'Condusef',
      categories: ['Diplomados', 'Gratis'],
    },
    {
        id: 9,
        name: 'Curso de educación financiera',
        image: curso4,
        link: 'https://edutin.com/curso-de-educacion-financiera-4325',
        owner: 'Edutin Academy',
        categories: ['Diplomados', 'Gratis'],
    },
    {
        id: 10,
        name: 'Finanzas Para No Financieros: Análisis y Visualización',
        image: curso10,
        link: 'https://www.udemy.com/course/estimacion-visualizacion-y-analisis-de-razones-financieras/',
        owner: 'Udemy',
        categories: ['Udemy', 'Paga'],
    },
    {
        id: 11,
        name: 'Finanzas Para No Financieros',
        image: curso11,
        link: 'https://www.udemy.com/course/finanzas-para-no-financieros-e/',
        owner: 'Udemy',
        categories: ['Udemy', 'Paga'],
    },
    {
        id: 12,
        name: 'Planificación Financiera: Estados Financieros Presupuestados',
        image: curso12,
        link: 'https://www.udemy.com/course/planificacion-financiera-estados-financieros-presupuestados/',
        owner: 'Udemy',
        categories: ['Udemy', 'Paga'],
    },
    {
        id: 13,
        name: 'Aprende de finanzas personales desde cer0',
        image: curso13,
        link: 'https://www.udemy.com/course/aprende-de-finanzas-personales-desde-cero/',
        owner: 'Udemy',
        categories: ['Udemy', 'Paga'],
    },
    {
        id: 14,
        name: 'Finanzas personales - Aprende a Comprar, Ahorrar e Invertir',
        image: curso14,
        link: 'https://www.udemy.com/course/finanzas-personales-aprende-a-comprar-ahorrar-e-invertir/',
        owner: 'Udemy',
        categories: ['Udemy', 'Paga'],
    },
  ];

  // Categorías únicas
  const categories = Array.from(
    new Set(courses.flatMap((course) => course.categories))
  );

  // Estado para la categoría seleccionada
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  // Filtrar cursos según la categoría seleccionada
  const filteredCourses =
    selectedCategory === 'Todos'
      ? courses
      : courses.filter((course) =>
          course.categories.includes(selectedCategory)
        );

  return (
    <div className="courses-catalog">
      <h2 className="catalog-title">Catálogo de Cursos</h2>
      {/* Filtro de categorías */}
      <div className="categories-list">
        <button
          onClick={() => setSelectedCategory('Todos')}
          className={`category-button ${
            selectedCategory === 'Todos' ? 'active' : ''
          }`}
        >
          Todos
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`category-button ${
              selectedCategory === category ? 'active' : ''
            }`}
          >
            {category}
          </button>
        ))}
      </div>
      {/* Renderizado de los cursos */}
      <div className="courses-grid">
        {filteredCourses.map((course) => (
          <div key={course.id} className="course-card">
            <a href={course.link} target="_blank" rel="noopener noreferrer">
              <img
                src={course.image}
                alt={course.name}
                className="course-image"
              />
              <h3 className="course-name">{course.name}</h3>
              <p className="course-owner">Por: {course.owner}</p>
            </a>
          </div>
        ))}
        {filteredCourses.length === 0 && (
          <p className="no-courses-message">No hay cursos en esta categoría.</p>
        )}
      </div>
    </div>
  );
};

export default CoursesCatalog;
