import { createApp } from 'vue';
import type { SchemeDocument } from '../tests/scheme';
import lightAccent from '../tests/fixtures/schemes/light-accent.json';
import defaultScheme from '../tests/fixtures/schemes/vasak-default.json';
import Bench from './Bench.vue';
import { applyBenchQuery } from './setup';
import './main.css';

const schemes = {
	'vasak-default': defaultScheme as SchemeDocument,
	'light-accent': lightAccent as SchemeDocument,
};

createApp(Bench, applyBenchQuery(document.documentElement, location.search, schemes)).mount('#app');
