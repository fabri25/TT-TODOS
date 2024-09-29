import React from 'react';
import '../styles/CustomToolbar.css'; // Importa el archivo CSS personalizado

const CustomToolbar = (toolbar) => {
  const goToBack = () => {
    toolbar.onNavigate('PREV');
  };

  const goToNext = () => {
    toolbar.onNavigate('NEXT');
  };

  const goToMonthView = () => {
    toolbar.onView('month');
  };

  const goToWeekView = () => {
    toolbar.onView('week');
  };

  const goToDayView = () => {
    toolbar.onView('day');
  };

  const goToAgendaView = () => {
    toolbar.onView('agenda');
  };

  return (
    <div className="rbc-toolbar">
      <span className="rbc-btn-group">
        {/* Botón de navegación atrás */}
        <button type="button" onClick={goToBack}>
          &lt;
        </button>
      </span>
      
      {/* Nombre del mes en el centro */}
      <span className="rbc-toolbar-label">
        {toolbar.label}
      </span>
      
      <span className="rbc-btn-group">
        {/* Botón de navegación adelante */}
        <button type="button" onClick={goToNext}>
          &gt;
        </button>
      </span>
      
      {/* Botones de vista */}
      <span className="rbc-btn-group">
        <button type="button" onClick={goToMonthView}>Month</button>
        <button type="button" onClick={goToWeekView}>Week</button>
        <button type="button" onClick={goToDayView}>Day</button>
        <button type="button" onClick={goToAgendaView}>Agenda</button>
      </span>
    </div>
  );
};

export default CustomToolbar;
