import { Workout } from './Workout';

class Markup {
  static WORKOUT_MENU = `
    <div class="workout__menu">
      <button class='workout__menu-btn workout__menu-btn--edit'>
        <svg class="workout__menu-icon workout__menu-icon--edit">
          <use xlink:href="img/sprite.svg#icon-pencil"></use>
        </svg>
      </button>
    
      <button class='workout__menu-btn workout__menu-btn--delete'>
        <svg class="workout__menu-icon workout__menu-icon--delete">
          <use xlink:href="img/sprite.svg#icon-cross"></use>
        </svg>
      </button>
    </div>
  `;

  static genUpdateForm(workoutType, workoutId) {
    return `
      <div class='workout__update-form' data-id='${workoutId}'>
        <form id='${workoutId}' class='form form--update'>
          <div class="form__row">
            <label for="type" class="form__label">Type</label>
            <select id="type" class="form__input form__input--type">
              <option 
                value="running" 
                ${workoutType === 'running' ? 'selected' : ''}
              >
                Running
              </option>
              <option 
                value="cycling" 
                ${workoutType === 'cycling' ? 'selected' : ''}
              >
                Cycling
              </option>
            </select>
          </div>
            
          <div class="form__row">
            <label for="distance" class="form__label">Distance</label>
            <input
              type="number"
              step="0.01"
              id="distance"
              class="form__input form__input--distance"
              placeholder="km"
            />
          </div>
           
          <div class="form__row">
            <label for="duration" class="form__label">Duration</label>
            <input
              type="number"
              step="0.01"
              id="duration"
              class="form__input form__input--duration"
              placeholder="min"
            />
          </div>
            
          <div class="form__row ${
            workoutType === 'cycling' ? 'form__row--hidden' : ''
          }">
            <label for="cadence" class="form__label">Cadence</label>
            <input
              type="number"
              id="cadence"
              class="form__input form__input--cadence"
              placeholder="step/min"
            />
          </div>
            
          <div class="form__row ${
            workoutType === 'running' ? 'form__row--hidden' : ''
          }">
            <label for="elevation" class="form__label">Elev Gain</label>
            <input
              type="number"
              step="0.01"
              id="elevation"
              class="form__input form__input--elevation"
              placeholder="meters"
            />
          </div>
          
          <input type='hidden' id='workout-id' name='workout-id' value=''/>
          
          <button class='btn' type='submit'>OK</button>
          <button class='btn btn--close'>Close</button>
        </form>
      </div>
    `;
  }

  static genWorkoutDetail(name, icon, value, unit) {
    return `
      <div class="workout__details workout__details--${name}">
        <span class="workout__icon">${icon}</span>
        <span class="workout__value">${value}</span>
        <span class="workout__unit">${unit}</span>
      </div>
    `;
  }

  static genRunning(workout) {
    return `
      <li class="workout workout--${workout.type} disable-select" data-id="${
      workout.id
    }">
        ${Markup.WORKOUT_MENU}
        <h2 class="workout__title">${Workout.getTitle(workout)}</h2>
        ${Markup.genWorkoutDetail(
          'distance',
          '🏃‍♂️',
          workout.distance,
          'km'
        )}        
        ${Markup.genWorkoutDetail('duration', '⏱', workout.duration, 'min')}
        ${Markup.genWorkoutDetail('pace', '⚡️', workout.pace, 'min/km')}
        ${Markup.genWorkoutDetail('cadence', '🦶🏼', workout.cadence, 'spm')}
      </li>
    `;
  }

  static genCycling(workout) {
    return `
      <li class="workout workout--${workout.type} disable-select" data-id="${
      workout.id
    }">
        ${Markup.WORKOUT_MENU}
        <h2 class="workout__title">${Workout.getTitle(workout)}</h2>
        ${Markup.genWorkoutDetail(
          'distance',
          '🚴‍♀',
          workout.distance,
          'km'
        )}        
        ${Markup.genWorkoutDetail('duration', '⏱', workout.duration, 'min')}
        ${Markup.genWorkoutDetail('speed', '⚡️', workout.speed, 'km/h')}
        ${Markup.genWorkoutDetail('elevation', '⛰', workout.elevation, 'm')}
      </li>
    `;
  }

  static genWorkout(workout) {
    if (workout.type === 'running') {
      return Markup.genRunning(workout);
    }

    if (workout.type === 'cycling') {
      return Markup.genCycling(workout);
    }
  }

  static convertWorkout(currentElem, type) {
    currentElem.classList.remove('workout--running', 'workout--cycling');
    currentElem.classList.add(`workout--${type}`);

    const detailElems = currentElem.querySelectorAll('.workout__details');

    if (type === 'running') {
      detailElems[0].querySelector('.workout__icon').textContent = '🏃‍♂️';

      detailElems[2].className = 'workout__details workout__details--pace';
      detailElems[2].querySelector('.workout__unit').textContent = 'min/km';

      detailElems[3].className = 'workout__details workout__details--cadence';
      detailElems[3].querySelector('.workout__icon').textContent = '🦶🏼';
      detailElems[3].querySelector('.workout__unit').textContent = 'spm';
    }

    if (type === 'cycling') {
      detailElems[0].querySelector('.workout__icon').textContent = '🚴‍♀';

      detailElems[2].className = 'workout__details workout__details--speed';
      detailElems[2].querySelector('.workout__unit').textContent = 'km/h';

      detailElems[3].className = 'workout__details workout__details--elevation';
      detailElems[3].querySelector('.workout__icon').textContent = '⛰';
      detailElems[3].querySelector('.workout__unit').textContent = 'm';
    }
  }
}

export default Markup;
