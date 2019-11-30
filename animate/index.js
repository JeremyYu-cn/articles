'use strict';

const head = document.querySelector('head');
const body = document.querySelector('body');
const animate = new Animate(head, body);

animate
.text('p', {class: 'text'}, {}, 'hello!', 200)
.text('p', {class: 'text'}, {}, 'I\'m a little brid and this is my reseum', 500)
.text('p', {class: 'text'}, {}, 'name: caixukun', 500)
.text('p', {class: 'text'}, {}, 'hobby: sing jump rap and basketball', 500)
.text('p', {class: 'text'}, {}, 'practice exprience: 2.5 years', 500)
.text('p', {class: 'text'}, {}, 'music!', 500)
.text('p', {class: 'text'}, {}, '样式有点不好看，来修改一下样式吧', 500)
.style('*', {margin: 0, padding: 0, 'transition': 'all 0.5s ease'}, 1000)
.style('body', {display: 'flex', 'align-content': 'center', 'justify-content': 'center'}, 1000)
.style('.text_content, .style_content', {'padding': '.5rem', margin: '1rem'}, 1000)
.style('p', {margin: '0',}, 1000)
.style('ul', {'margin': '1rem',}, 1000)
.style('li', {'list-style-type': 'none',}, 1000)
.style('li > p', {'margin-left': '1rem',}, 1000)
.style('.selector', {'color': '#3daf3d',}, 500)
.style('.style_brackets', {'color': '#a3a3e2',}, 500)
.style('.style_name', {'color': '#ea6666',}, 500)
.style('.style_colon', {'color': '#4b00ff',}, 500)
.style('.style', {'color': '#30da93',}, 500)
.style('.text', {'margin': '1rem', 'font-size': '1rem'}, 1000)
.text('p', {class: 'text'}, {}, 'thanks!', 1000)


