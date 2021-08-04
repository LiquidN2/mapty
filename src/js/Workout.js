export class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10); // get last 10 digits

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = Number(distance);
    this.duration = Number(duration);
    this._getDisplayDate();
  }

  _getDisplayDate() {
    // prettier-ignore
    const months = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.displayDate = `${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }

  setId(id) {
    this.id = id;
  }

  setDate(date) {
    this.date = typeof date === 'string' ? new Date(date) : date;
    this._getDisplayDate();
  }

  setMarker(marker) {
    this.marker = marker;
  }

  unsetMarker() {
    this.marker = null;
  }

  setDistance(distance) {
    this.distance = distance;
  }

  setDuration(duration) {
    this.duration = duration;
  }

  static getTitle(workout) {
    let { type } = workout;
    const { displayDate } = workout;
    type = [type[0].toUpperCase(), type.slice(1)].join('');
    return `${type} on ${displayDate}`;
  }

  static getPopupContent(workout) {
    const { emoji } = workout;
    return `${emoji} ${Workout.getTitle(workout)}`;
  }
}

export class Running extends Workout {
  type = 'running';
  emoji = '🏃‍♂️';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = Number(cadence);
    this._calcPace();
  }

  _calcPace() {
    this.pace = Number((this.duration / this.distance).toFixed(2));
  }
}

export class Cycling extends Workout {
  type = 'cycling';
  emoji = '🚴‍♀';

  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = Number(elevation);
    this._calcSpeed();
  }

  _calcSpeed() {
    this.speed = Number(((this.distance * 60) / this.duration).toFixed(2));
  }
}
