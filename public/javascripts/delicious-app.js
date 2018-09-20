import '../sass/style.scss';

import { $, $$ } from './modules/bling';
import autocomplete from './modules/autocomplete';
import typeAhead from './modules/typeAhead';
import ajaxHeart from './modules/heart';

autocomplete($('#address'), $('#lat'), $('#lng'));

typeAhead($('.search'));

const heartForms = $$('form.heart'); // select all the heart forms
heartForms.on('submit', ajaxHeart); // on submit aka click on heart run ajaxHeart
