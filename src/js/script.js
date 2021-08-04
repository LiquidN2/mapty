'use strict';

import '../scss/style.scss';
import 'flatpickr/dist/flatpickr.min.css';

import L from 'leaflet';
import flatpickr from 'flatpickr';

import { Workout, Running, Cycling } from './Workout';
import Markup from './Markup';

const containerWorkouts = document.querySelector('.workouts');
const formNew = document.querySelector('#form--new');
const newInput = {};
['type', 'distance', 'duration', 'cadence', 'elevation'].forEach(name => {
  newInput[name] = document.querySelector(`#form--new .form__input--${name}`);
});

const formFilter = document.querySelector('#form--filter');
const filterInput = {};
['running', 'cycling', 'sort', 'date'].forEach(filter => {
  filterInput[filter] = document.querySelector(
    `.form__input--filter-${filter}`
  );
});
const btnDeleteAll = document.querySelector('.btn--delete-all');

// const btnInspect = document.querySelector('.btn--inspect');
// const btnInspectAll = document.querySelector('.btn--inspect-all');
// const btnRmMkr = document.querySelector('.btn--remove-mkr');

//---------------------------------
// APP
//---------------------------------
class App {
  #zoomLevel = 13;
  #map;
  #mapEvent;
  #workouts;
  #workout;
  #workoutCard;
  #containerFormUpdate;
  #formUpdate;
  #updateInput = {};

  constructor() {
    this._getPosition();

    this._getLocalStorage();

    this._showFormFilter();

    App._renderWorkoutCards(this.#workouts);

    newInput.type.addEventListener('change', () => {
      App._toggleHiddenFields(newInput.cadence, newInput.elevation);
    });

    formNew.addEventListener('submit', this._newWorkout.bind(this));

    flatpickr('#filter--date', {
      mode: 'range',
      dateFormat: 'd-m-Y',
      position: 'auto center',
    });
    formFilter.addEventListener('submit', this._filterWorkouts.bind(this));

    containerWorkouts.addEventListener(
      'click',
      this._interactWorkout.bind(this)
    );

    btnDeleteAll.addEventListener('click', e => {
      e.preventDefault();
      console.log('delete all');
    });

    // btnInspect.addEventListener('click', () => console.log(this.#workout));
    // btnInspectAll.addEventListener('click', () => console.log(this.#workouts));
    // btnRmMkr.addEventListener('click', () => this.#workout.marker.remove());
  }

  //---------------------------------
  // FORM
  //---------------------------------
  static _clearInputs(...inputs) {
    inputs.forEach(input => (input.value = ''));
  }

  static _hideFormNew() {
    // Clear inputs
    App._clearInputs(
      newInput.distance,
      newInput.duration,
      newInput.cadence,
      newInput.elevation
    );

    // Hide forms
    formNew.style.display = 'none';
    if (formNew.classList.contains('hidden')) return;
    formNew.classList.add('hidden');
    setTimeout(() => (formNew.style.display = 'grid'), 1000);
  }

  _showFormFilter() {
    if (this.#workouts.length < 2) return;
    formFilter.classList.remove('hidden');
  }

  _showFormNew(mapE) {
    this.#mapEvent = mapE;

    formNew.classList.remove('hidden');
    newInput.distance.blur();
  }

  _showFormUpdate(workoutId) {
    // Find workout
    if (workoutId) this.#workout = this._findWorkoutById(workoutId);

    // Close currently open form
    if (this.#containerFormUpdate) {
      this.#containerFormUpdate.remove();
      if (this.#containerFormUpdate.dataset.id === this.#workout.id)
        return (this.#containerFormUpdate = null);
    }

    // Create new form
    const updateFormMarkup = Markup.genUpdateForm(
      this.#workout.type,
      this.#workout.id
    );
    this.#workoutCard.insertAdjacentHTML('beforeend', updateFormMarkup);

    // DOM selection
    this.#containerFormUpdate = this.#workoutCard.querySelector(
      '.workout__update-form'
    );
    this.#formUpdate = this.#containerFormUpdate.querySelector('.form--update');

    // Fill form with current workout data
    this._prefillFormUpdate();

    // Listen to form events ('submission', 'closing', 'type change')
    this._listenFormUpdateEvents();
  }

  _prefillFormUpdate() {
    this.#updateInput.id = this.#formUpdate.querySelector('#workout-id');
    this.#updateInput.id.value = this.#workout.id;
    ['type', 'distance', 'duration', 'cadence', 'elevation'].forEach(field => {
      this.#updateInput[field] = this.#formUpdate.querySelector(
        `.form__input--${field}`
      );
      if (this.#updateInput[field] && this.#workout[field])
        this.#updateInput[field].value = this.#workout[field];
    });
  }

  _listenFormUpdateEvents() {
    // Handles form close button
    this.#formUpdate
      .querySelector('.btn--close')
      .addEventListener('click', e => {
        e.preventDefault();
        this.#containerFormUpdate.remove();
      });

    // Handles dynamic field display
    this.#updateInput.type.addEventListener('change', () => {
      App._toggleHiddenFields(
        this.#updateInput.cadence,
        this.#updateInput.elevation
      );
    });

    // Handles form submission
    this.#formUpdate.addEventListener('submit', this._updateWorkout.bind(this));
  }

  static _toggleHiddenFields(...fields) {
    fields.forEach(field => {
      field.value = '';
      field.closest('.form__row').classList.toggle('form__row--hidden');
    });
  }

  //---------------------------------
  // DATA / MODEL
  //---------------------------------
  static _parseDateRange(rangeStr) {
    let fromStr, toStr, toDate;
    if (rangeStr.includes('to')) {
      [fromStr, , toStr] = rangeStr.split(' ');
    } else {
      fromStr = rangeStr;
      toStr = null;
    }

    const [fromDateStr, fromMonthStr, fromYearStr] = fromStr.split('-');
    const fromDate = new Date(
      fromYearStr,
      Number(fromMonthStr) - 1,
      fromDateStr
    );

    if (toStr) {
      console.log(toStr);
      const [toDateStr, toMonthStr, toYearStr] = toStr.split('-');
      toDate = new Date(
        toYearStr,
        Number(toMonthStr) - 1,
        toDateStr,
        23,
        59,
        59
      );
    } else {
      toDate = new Date(
        fromYearStr,
        Number(fromMonthStr) - 1,
        Number(fromDateStr),
        23,
        59,
        59
      );
    }

    return {
      fromDate,
      toDate,
    };
  }

  static _validInput(...inputs) {
    return inputs.every(input => input > 0);
  }

  _findWorkoutById(id) {
    return this.#workouts.find(workout => workout.id === id);
  }

  _filterWorkouts(formE) {
    formE.preventDefault();

    // Filter by type(s)
    let result = this.#workouts.filter(workout => {
      const cycling = filterInput.cycling.checked && workout.type === 'cycling';
      const running = filterInput.running.checked && workout.type === 'running';
      return cycling || running;
    });

    // Filter by date range
    if (filterInput.date.value) {
      const { fromDate, toDate } = App._parseDateRange(filterInput.date.value);
      result = result.filter(
        workout => workout.date >= fromDate && workout.date <= toDate
      );
    }

    // Sort result
    if (filterInput.sort.value) {
      if (filterInput.sort.value === 'asc-date') {
        result.sort((a, b) => b.date - a.date);
      }

      if (filterInput.sort.value === 'des-date') {
        result.sort((a, b) => a.date - b.date);
      }

      if (filterInput.sort.value === 'asc-distance') {
        result.sort((a, b) => b.distance - a.distance);
      }

      if (filterInput.sort.value === 'des-distance') {
        result.sort((a, b) => a.distance - b.distance);
      }

      if (filterInput.sort.value === 'asc-duration') {
        result.sort((a, b) => b.duration - a.duration);
      }

      if (filterInput.sort.value === 'des-distance') {
        result.sort((a, b) => a.duration - b.duration);
      }
    }

    // Render filtered workout cards
    App._removeAllWorkoutCard();
    App._renderWorkoutCards(result);

    // Render filtered workout markers
    this._unrenderAllWorkoutMarkers();
    result.forEach(workout => this._renderWorkoutMarker(workout));
  }

  _newWorkout(formE) {
    formE.preventDefault();

    // get coords
    const {
      latlng: { lat, lng },
    } = this.#mapEvent;
    const coords = [lat, lng];

    // get form data
    const type = newInput.type.value;
    const distance = newInput.distance.value;
    const duration = newInput.duration.value;
    const cadence = newInput.cadence.value;
    const elevation = newInput.elevation.value;

    // validate form data and create workout obj
    let workout;

    if (type === 'running') {
      if (!App._validInput(distance, duration, cadence)) return;
      workout = new Running(coords, distance, duration, cadence);
    }

    if (type === 'cycling') {
      if (!App._validInput(distance, duration, elevation)) return;
      workout = new Cycling(coords, distance, duration, elevation);
    }

    // render workout card
    App._renderWorkoutCard(workout);

    // render workout on map
    this._renderWorkoutMarker(workout);

    // save workout to local storage
    this.#workouts.push(workout);
    this._setLocalStorage();

    // hide form
    App._hideFormNew();

    // Show filter form
    this._showFormFilter();
  }

  _interactWorkout(event) {
    this.#workoutCard = event.target.closest('.workout');
    if (!this.#workoutCard) return;

    const workoutId = this.#workoutCard.dataset.id;

    // Click Delete
    if (event.target.closest('.workout__menu-btn--delete')) {
      return this._deleteWorkout(workoutId);
    }

    // Click Edit
    if (event.target.closest('.workout__menu-btn--edit')) {
      return this._showFormUpdate(workoutId);
    }

    this._centerMap(workoutId);
  }

  _deleteWorkout(workoutId) {
    const id = workoutId || this.#workout.id;

    const workoutIndex = this.#workouts.findIndex(workout => workout.id === id);
    if (workoutIndex === -1) return;

    // remove marker on map
    this._removeWorkoutMarker(this.#workouts[workoutIndex]);

    // remove workout card
    App._removeWorkoutCard(workoutId);

    // remove workout from this.#workouts
    this.#workouts.copyWithin(workoutIndex, workoutIndex + 1);
    --this.#workouts.length;

    this.#workout = null;
    this.#workoutCard = null;

    // update workouts in localStorage
    this._setLocalStorage();
  }

  _updateWorkout(formE) {
    formE.preventDefault();

    // fetch form data
    const data = {
      id: this.#workout.id,
      date: this.#workout.date,
      coords: this.#workout.coords,
      type: this.#updateInput.type.value,
      distance: this.#updateInput.distance.value,
      duration: this.#updateInput.duration.value,
      cadence: this.#updateInput.cadence.value,
      elevation: this.#updateInput.elevation.value,
    };

    // validate & update data
    const inputErrorMsg = 'All input must be positive numbers';
    if (
      data.type === 'running' &&
      !App._validInput(data.distance, data.duration, data.cadence)
    )
      // eslint-disable-next-line no-alert
      return alert(inputErrorMsg);
    if (
      data.type === 'cycling' &&
      !App._validInput(data.distance, data.duration, data.elevation)
    )
      // eslint-disable-next-line no-alert
      return alert(inputErrorMsg);

    if (this.#workout.id !== this.#updateInput.id.value) return;

    // remove map marker
    this._removeWorkoutMarker(this.#workout);

    // build new workout obj from form data
    this.#workout = App._rebuildWorkout(data);

    // Replace old workout with updated one
    const workoutIndex = this.#workouts.findIndex(
      workout => workout.id === this.#updateInput.id.value
    );
    if (workoutIndex === -1) return;
    this.#workouts.splice(workoutIndex, 1, this.#workout);

    // persist data to local storage
    this._setLocalStorage();

    // update workout card
    this._updateWorkoutCard(this.#workout);

    // update workout marker
    this._renderWorkoutMarker(this.#workout);

    // remove update form
    this.#containerFormUpdate.remove();
  }

  //---------------------------------
  // MAP
  //---------------------------------
  _getPosition() {
    if (navigator.geolocation) {
      const success = this._loadMap.bind(this);
      const error = err => console.error(err);
      const options = { enableHighAccuracy: false };

      navigator.geolocation.getCurrentPosition(success, error, options);
    }
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map('map').setView(coords, this.#zoomLevel);

    L.tileLayer(
      'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}',
      {
        attribution:
          'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 19,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken:
          'pk.eyJ1IjoibGlkcXVpZG4yIiwiYSI6ImNrcmJzYzRtZTI4bmQyb252cGprNmNkZjkifQ.L71XFTvL2zoKvC6xscpyLw',
      }
    ).addTo(this.#map);

    this.#workouts.forEach(workout => this._renderWorkoutMarker(workout));

    this.#map.on('click', this._showFormNew.bind(this));
  }

  _centerMap(workoutId) {
    const { coords } = this._findWorkoutById(workoutId);

    this.#map.setView(coords, this.#zoomLevel, {
      animate: true,
      pan: { duration: 1 },
    });
  }

  _renderWorkoutMarker(workout) {
    this._removeWorkoutMarker(workout);

    const popup = L.popup({
      maxWidth: 250,
      minWidth: 100,
      autoClose: false,
      closeOnClick: false,
      className: `${workout.type}-popup disable-select`,
    }).setContent(Workout.getPopupContent(workout));

    workout.setMarker(L.marker(workout.coords));
    workout.marker.addTo(this.#map).bindPopup(popup).openPopup();
  }

  _unrenderWorkoutMarker(workout) {
    if (!workout.marker) return;
    workout.marker.remove();
  }

  _unrenderAllWorkoutMarkers() {
    this.#workouts.forEach(workout => this._unrenderWorkoutMarker(workout));
  }

  _removeWorkoutMarker(workout) {
    this._unrenderWorkoutMarker(workout);
    workout.unsetMarker();
  }

  //---------------------------------
  // UI
  //---------------------------------
  static _renderWorkoutCard(workout) {
    const html = Markup.genWorkout(workout);
    formFilter.insertAdjacentHTML('afterend', html);
  }

  static _renderWorkoutCards(workouts) {
    if (workouts.length === 0) return;
    workouts.forEach(workout => App._renderWorkoutCard(workout));
  }

  static _removeWorkoutCard(workoutId) {
    containerWorkouts.querySelector(`[data-id="${workoutId}"]`).remove();
  }

  static _removeAllWorkoutCard() {
    containerWorkouts
      .querySelectorAll('.workout')
      .forEach(workoutCard => workoutCard.remove());
  }

  _updateWorkoutCard(workout) {
    // Update card layout
    Markup.convertWorkout(this.#workoutCard, workout.type);

    // Update card title
    this.#workoutCard.querySelector('.workout__title').textContent =
      Workout.getTitle(workout);

    // Update card details
    ['distance', 'duration', 'cadence', 'elevation', 'pace', 'speed'].forEach(
      field => {
        const fieldDataElem = this.#workoutCard.querySelector(
          `.workout__details--${field} .workout__value`
        );

        if (!fieldDataElem) return;
        fieldDataElem.textContent = workout[field] || '';
      }
    );
  }

  //---------------------------------
  // DATA PERSISTENCE
  //---------------------------------
  static _rebuildWorkout(obj) {
    const { id, date, type, coords, distance, duration } = obj;
    let workout;

    if (type === 'running') {
      const { cadence } = obj;
      workout = new Running(coords, distance, duration, cadence);
    }

    if (type === 'cycling') {
      const { elevation } = obj;
      workout = new Cycling(coords, distance, duration, elevation);
    }

    workout.setId(id);
    workout.setDate(date);

    return workout;
  }

  _setLocalStorage() {
    const data = this.#workouts.map(workout => ({
      id: workout.id,
      date: workout.date,
      type: workout.type,
      coords: workout.coords,
      distance: workout.distance,
      duration: workout.duration,
      cadence: workout.cadence,
      elevation: workout.elevation,
    }));

    localStorage.setItem('workouts', JSON.stringify(data));
  }

  _getLocalStorage() {
    try {
      // this.#workouts = JSON.parse(localStorage.getItem('workouts'));
      this.#workouts = JSON.parse(localStorage.getItem('workouts')).map(
        workout => App._rebuildWorkout(workout)
      );
    } catch (e) {
      this.#workouts = [];
    }
  }
}

void new App();
