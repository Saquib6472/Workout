'use strict';

// geolocation API
// by this geolocation API we can allow any site to know our location.such as find my iphone,grubhub, uber etc..

/*this getcurrentPosition() function here takes as an input to callback functions,and the 1st one is to callback function that will be called on success, so whenever the 
browser successfully got the coordinates of the current postion of the user.and the 2nd callback is the error callback which is the one that is gonna be called where there
appened an eroor while getting the coordinates.
*/

// Leaflet:  it is a third party library that going to display a map.to display the map we need to google leaflet and the easiest way to get the map by copying the hosted version.then we can
// paste it in our HTML head before our own made script.
// since both the workouts have almost same data such as like duration,distance, that's why we have make a parent class which will contain both of their workouts that have in common.

class Workout {
  // now what we want for our each workout object is a date.

  date = new Date();
  id = (Date.now() + '').slice(-10); // date.now will give us the current time stamp.also since we don't want to hard code the id that's why we are getting the from date itself which is gonna
  // slice the numbers first then will put them into the empty string.
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords; //[lat,lng]
    this.distance = distance; //in km
    this.duration = duration; //in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
    /*here since the array is 0 based the months will go as 0-11, so that's very nice for a 0 based array, because we can now essentially use the [this.date.getmonth()] number here to retrive
          any value out of our month array.so if getmonths returns 0, then month at position 0 is gonna be january and the same is of course true for all the other months */
  }

  click() {
    this.clicks++; // incrementing how many time we clicked on the workouts.
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, distance);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription(); // the reason of calling the setdescription method in each of the child classes is because that's the class that contains the type we need for this calculation.
  }

  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling'; // so the reason for doing this is so on the newworkout method the classname type will have no idea what is the type going to do.that's y we simply defining it in here.
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription(); // the reason of calling the setdescription method in each of the child classes is because that's the class that contains the type we need for this calculation.
  }

  calcSpeed() {
    // speed is basically the opposite of the pace
    //Km/h
    this.speed = this.distance / (this.duration / 60); // this duration in hours that's why we need to set it up like this.
    return this.speed;
  }
}

//const run1 = new Running([39, -12], 5.2, 24, 178);//5.2km,24min,178 steps
//const run2 = new Cycling([39, -12], 27, 95, 523);//27km,95min,523 meters
//console.log(run1, run2);

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

//Application Architecture
class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  constructor() {
    //Get users position
    this._getPosition();

    //Get data from local storage

    this._getLocalStorage();

    //Attach event handlers
    form.addEventListener('submit', this._newWorkout.bind(this)); // this submit event will work everytime we hit enter in our keyboard
    inputType.addEventListener('change', this._toggleElevation);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () // here bind method will bind the loadmap method and getposition method together.
        {
          alert('Could not get your position');
        }
      );
    }
  }

  _loadMap(position) {
    //console.log(position);

    const { latitude } = position.coords; // we got the coords from the console.log. which defines the latitude and longitude.and we destructured the latitude in here cause
    //instead of doing this position.coords.latitude, we could simply destructure the variable by that name and that name will take out
    // latitude property of that coords object.
    const { longitude } = position.coords;
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`); // that's how we get our map by latitude and longitude.

    const coords = [latitude, longitude];

    //The main reason of storing a variable to create the map is onto the map object variable we can now add an eventlistener which is map.on() and also this map.on()method here it's not
    // coming from js.it is instead coming from the leaflet library.this on()method is now gonna work as an eventlistener.
    // here it will show an error bcz the this keyword only will work as undefined,cause here this keyword is calling a regular function call.and the this keyword doesn't work like that.that's
    //why we need to bind the this keyword by the bind method.
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel); // the L here represents the leaflet.

    L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png', // we can also make our own map example {s}.fr/hot/=>we used this to change the openstreetmap.
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    ).addTo(this.#map);

    //Handling clicks on map

    this.#map.on('click', this._showForm.bind(this)); // we bind it here cause the this keyword in here is pointing the app object.

    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE; // we did this one here cause we don't need this mapevent right here in this function which is the place where we get access to it.and so we basically copy it
    // to a global variable and then on the form eventlistener where we do actually need it,we will get access to the lobal variable and then we can use the latitude and
    //longitude on the form eventlistener function.
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    //empty inputs
    inputDistance.value,
      inputDuration.value,
      inputCadence.value,
      (inputElevation.value = '');
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevation() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden'); // we did this to show a menu bar such as drp down menu where we can choose between one of them.
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const validInputs = (
      ...inputs // so here when we put a rest parameter(...inputs) like this it always creates an array
    ) => inputs.every(inp => Number.isFinite(inp)); // so basically the every method will loop over the array and then it will check whether the number isfinite or not and then in the end the
    //every method will only return true if the value of Number.isfinite() was true for all of them.but if only one of this value here is not
    // finite, so if the result here was fault for one of the elements of the array then every method will return false.
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    //Get Data from here
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //If workout running,create running day
    if (type === 'running') {
      const cadence = +inputCadence.value; // so here if the type of workout is running then we will get the cadence value.
      //Check if data is valid
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        // ifthe case is string it will show alert or if the case is >0 it will also show an alert
        //(!Number.isFinite(distance) || (!Number.isFinite(duration) || (!Number.isFinite(cadence))));

        return alert('Inputs must be positive numbers'); // so here the distance will come as a string and isfinite will check if the distance is a number or not
      // if it's NAN then it will show alert sign.)

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //If workout cycling,create cycling day
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      //Check if data is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        //(!Number.isFinite(distance) || (!Number.isFinite(duration) || (!Number.isFinite(cadence))));

        return alert('Inputs must be positive numbers'); // so here the distance will come as a string and isfinite will check if the distance is a number or not
      // if it's NAN then it will show alert sign.)

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    //Add new object to workout array
    this.#workouts.push(workout); // here the dynamic workouts array will push to the workout variable

    //Render workout on map as marker

    this._renderWorkoutMarker(workout);

    //Render workout on list
    this._renderWorkout(workout);

    // Hide form
    this._hideForm();

    // set local storage to all workout

    this._setLocalStorage();

    //display marker
    //console.log(mapEvent);
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords) //so now the workout becomes very important for the 1st time to have some data in the actual workout object.because here we do need that to tell leaflet where to
      // display this marker.
      .addTo(this.#map) // here L.marker is adds the marker to the map.so here evrytime we click the map on anywhere it will show a pop up and on that pop up it will say workout.
      .bindPopup(
        L.popup({
          // we can also create an object to the bindpopup method, now with this object we can change the behavior where the popup of one marker closes when we create a
          //when we create a new one.also we gonna get this popup methd from leaflet and we gonna use the method called autoclose, and we using this method cause when
          // we want to override the default behavior of the popup closing when another pop up is opened.
          maxWidth: 250,
          minWidth: 50,
          autoClose: false, // by default in leaflet docs that method sets to true, that's why we changed it to false
          closeOnClick: false, // this method will prevent popup from closing, but this time whenever the user clicks on the map.
          className: `${workout.type}-popup`, // we can use this one to assign any css class name that we want to the popup.
          //on this method we can use any string,html element and etc.
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍' : '🚴‍'} ${workout.description}`
      ) //on this method we can use any string,html element and etc.
      .openPopup();
  }

  _renderWorkout(
    workout // this function will also take in an object of the workout.
  ) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
          <h2 class="workout__title">${workout.description}</h2> 
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍' : '🚴‍'
            }</span> 
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

    /*here on the workout.pace value is actually calculated by js and so the result of this calculation might be some very weird number that's why we will simply round that to 1 descimal place.
         and we are going to round it by tofixed() method.*/

    if (workout.type === 'running')
      html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span> 
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;

    if (workout.type === 'cycling')
      html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`;
    // the reason for choosing the afterend in here because this one will basically add the new element as a sibling element at the end of the form.
    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    //console.log(workoutEl);

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    ); // matching both workouts data in here which is the id.
    console.log(workout);

    this.#map.setView(
      workout.coords,
      this.#mapZoomLevel, // the setview method needs as a 1st argument the coordinates, and then as the 2nd argument needs zoomlevel.
      {
        animate: true,
        pan: {
          duration: 1,
        },
      }
    );

    // using the public interface

    //workout.click();// by this method publics can see how many times we clicked on those workouts.
  }

  _setLocalStorage() {
    // localstorage is very simple API and so it is only adviced to use for a small amounts of data.
    localStorage.setItem('workouts', JSON.stringify(this.#workouts)); //localstorage is an API that a browser provide for us and then we can use.localstorage is a simple key value store which is
    // setitem(workouts) in here and then we need a simple value which much also be a string, but we can convert any object to a string by json.stringify method.
  }
  /*the getlocalstorage method here is executed right at the beginning, so right after the page loaded,so if we try to add the _renderworkoutmarker in the getlocalstorage method then we are
     trying to add the _renderworkoutmarker to the map right at the beginning, however at this point the map actually not yet being loaded, and so essentially we are trying to add a marker in 
     _renderworkoutmarker method which is(this.#map) is not actually define.so this is the 1st glimpse into the nature of Asynchronous Javascript.the reason of why we are saying that the map
     is not created right at the beginning when the application first loaded is that first the position of the user needs to bet get geolocation then _loadmap.after that the map will create.
     so that's why we need to set the _renderworkoutmarker method in loadmap function. */

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts')); // by this json.parse we can convert any string to an object.
    //console.log(data);

    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  reset() // the page in the console it will reset the workouts data.besides setItem and getItem we also have a method called removeItem in localstorage API. // so here since we dont have any public interface in here we can make this method as public interface, here we simply gonna remove the saved workouts data.so everytime if we reload
  {
    localStorage.removeItem('workouts');
    location.reload(); // location is basically a big object that contains a lot of properties and methods in the browser.so one of the methods is the ability to reload the page.
    // we basically reset the app in the console by app.reset().
  }
}

const app = new App();
