import axios from 'axios';
import {$} from './bling';

function ajaxHeart (e) {
  e.preventDefault(); // this stops the form from submitting using browser so we can post it ourselves d
  axios
    .post(this.action) // "this" is the event- ie the button that has been clicked in delicious-app
    .then(res => {
      const isHearted = this.heart.classList.toggle('heart__button--hearted'); // this is the form tag, heart is a property of the form tag - the class toggles on click
      $('.heart-count').textContent = res.data.hearts.length; // this will make the heart count equal to the length of the heart array
      if (isHearted) {
        this.heart.classList.add('heart__button--float'); // add classlist of heart button float to give floating heart
        setTimeout(() => this.heart.classList.remove('heart__button--float'), 2500); // after 2.5 seconds remove the floating heart class list.
      }
    })
    .catch(console.error);
};

export default ajaxHeart;
