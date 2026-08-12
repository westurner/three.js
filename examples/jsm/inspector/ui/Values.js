import { EventDispatcher } from 'three';

class Value extends EventDispatcher {

	constructor() {

		super();

		this.domElement = document.createElement( 'div' );
		this.domElement.className = 'param-control';

		this._onChangeFunction = null;

		this.addEventListener( 'change', ( e ) => {

			// defer to avoid issues when changing multiple values in the same call stack

			requestAnimationFrame( () => {

				if ( this._onChangeFunction ) this._onChangeFunction( e.value );

			} );

		} );

	}

	setValue( /*val*/ ) {

		this.dispatchChange();

		return this;

	}

	getValue() {

		return null;

	}

	dispatchChange() {

		this.dispatchEvent( { type: 'change', value: this.getValue() } );

	}

	onChange( callback ) {

		this._onChangeFunction = callback;

		return this;

	}

}

class ValueNumber extends Value {

	constructor( { value = 0, step = 0.1, min = - Infinity, max = Infinity } ) {

		super();

		this.input = document.createElement( 'input' );
		this.input.type = 'number';
		this.input.value = value;
		this.input.step = step;
		this.input.min = min;
		this.input.max = max;
		this.input.addEventListener( 'change', this._onChangeValue.bind( this ) );
		this.domElement.appendChild( this.input );
		this.addDragHandler();

	}

	_onChangeValue() {

		const value = parseFloat( this.input.value );
		const min = parseFloat( this.input.min );
		const max = parseFloat( this.input.max );

		if ( value > max ) {

			this.input.value = max;

		} else if ( value < min ) {

			this.input.value = min;

		} else if ( isNaN( value ) ) {

			this.input.value = min;

		}

		this.dispatchChange();

	}

	addDragHandler() {

		let isDragging = false;
		let startY, startValue;

		this.input.addEventListener( 'mousedown', ( e ) => {

			isDragging = true;
			startY = e.clientY;
			startValue = parseFloat( this.input.value );
			document.body.style.cursor = 'ns-resize';

		} );

		document.addEventListener( 'mousemove', ( e ) => {

			if ( isDragging ) {

				const deltaY = startY - e.clientY;
				const step = parseFloat( this.input.step ) || 1;
				const min = parseFloat( this.input.min );
				const max = parseFloat( this.input.max );

				let stepSize = step;

				if ( ! isNaN( max ) && isFinite( min ) ) {

					stepSize = ( max - min ) / 100;

				}

				const change = deltaY * stepSize;

				let newValue = startValue + change;
				newValue = Math.max( min, Math.min( newValue, max ) );

				const precision = ( String( step ).split( '.' )[ 1 ] || [] ).length;
				this.input.value = newValue.toFixed( precision );

				this.input.dispatchEvent( new Event( 'input' ) );

				this.dispatchChange();

			}

		} );

		document.addEventListener( 'mouseup', () => {

			if ( isDragging ) {

				isDragging = false;
				document.body.style.cursor = 'default';

			}

		} );

	}

	setValue( val ) {

		this.input.value = val;

		return super.setValue( val );

	}

	getValue() {

		return parseFloat( this.input.value );

	}

}

class ValueCheckbox extends Value {

	constructor( { value = false } ) {

		super();

		const label = document.createElement( 'label' );
		label.className = 'custom-checkbox';

		const checkbox = document.createElement( 'input' );
		checkbox.type = 'checkbox';
		checkbox.checked = value;
		this.checkbox = checkbox;

		const checkmark = document.createElement( 'span' );
		checkmark.className = 'checkmark';

		label.appendChild( checkbox );
		label.appendChild( checkmark );
		this.domElement.appendChild( label );

		checkbox.addEventListener( 'change', () => {

			this.dispatchChange();

		} );

	}

	setValue( val ) {

		this.checkbox.checked = val;

		return super.setValue( val );

	}

	getValue() {

		return this.checkbox.checked;

	}

}

class ValueSlider extends Value {

	constructor( { value = 0, min = 0, max = 1, step = 0.01 } ) {

		super();

		const sliderWrapper = document.createElement( 'div' );
		sliderWrapper.style.position = 'relative';
		sliderWrapper.style.flexGrow = '1';
		sliderWrapper.style.display = 'flex';
		sliderWrapper.style.alignItems = 'center';
		sliderWrapper.style.marginRight = '10px';

		this.slider = document.createElement( 'input' );
		this.slider.type = 'range';
		this.slider.min = min;
		this.slider.max = max;
		this.slider.step = step;
		this.slider.style.width = '100%';
		this.slider.style.margin = '0';
		this.slider.style.cursor = 'pointer';

		this.tickContainer = document.createElement( 'div' );
		this.tickContainer.style.position = 'absolute';
		this.tickContainer.style.left = '0';
		this.tickContainer.style.top = '0';
		this.tickContainer.style.width = '100%';
		this.tickContainer.style.height = '100%';
		this.tickContainer.style.pointerEvents = 'none';

		sliderWrapper.appendChild( this.tickContainer );
		sliderWrapper.appendChild( this.slider );

		const numberValue = new ValueNumber( { value, min, max, step } );
		this.numberInput = numberValue.input;
		this.numberInput.style.flexBasis = '80px';
		this.numberInput.style.flexShrink = '0';

		this.slider.value = value;

		this.domElement.append( sliderWrapper, this.numberInput );

		this.slider.addEventListener( 'input', () => {

			this.numberInput.value = this.slider.value;

			this.dispatchChange();

		} );

		numberValue.addEventListener( 'change', () => {

			this.slider.value = parseFloat( this.numberInput.value );

			this.dispatchChange();

		} );

	}

	setValue( val ) {

		this.slider.value = val;
		this.numberInput.value = val;

		return super.setValue( val );

	}

	setTicks( values ) {

		this.tickContainer.innerHTML = '';

		if ( values && values.length > 0 ) {

			const min = parseFloat( this.slider.min );
			const max = parseFloat( this.slider.max );
			const range = max - min;

			if ( range > 0 ) {

				const fragment = document.createDocumentFragment();

				for ( const value of values ) {

					const percent = ( value - min ) / range * 100;
					if ( percent >= 0 && percent <= 100 ) {

						const tick = document.createElement( 'div' );
						tick.style.position = 'absolute';
						tick.style.left = `${percent}%`;
						tick.style.width = '2px';
						tick.style.height = '8px';
						tick.style.top = '50%';
						tick.style.transform = 'translate(-50%, -50%)';
						tick.style.backgroundColor = 'var(--color-orange, #d4892f)';
						tick.style.pointerEvents = 'none';
						tick.style.opacity = '0.7';
						fragment.appendChild( tick );

					}

				}

				this.tickContainer.appendChild( fragment );

			}

		}

	}

	getValue() {

		return parseFloat( this.slider.value );

	}

	step( value ) {

		this.slider.step = value;
		this.numberInput.step = value;

		return this;

	}

}

class ValueSelect extends Value {

	constructor( { options = [], value = '' } ) {

		super();

		const select = document.createElement( 'select' );

		const createOption = ( name, optionValue ) => {

			const optionEl = document.createElement( 'option' );
			optionEl.value = name;
			optionEl.textContent = name;

			if ( optionValue == value ) optionEl.selected = true;

			select.appendChild( optionEl );

			return optionEl;

		};

		if ( Array.isArray( options ) ) {

			options.forEach( opt => createOption( opt, opt ) );

		} else {

			Object.entries( options ).forEach( ( [ key, value ] ) => createOption( key, value ) );

		}

		this.domElement.appendChild( select );

		//

		select.addEventListener( 'change', () => {

			this.dispatchChange();

		} );

		this.options = options;
		this.select = select;

	}

	setOptions( options ) {

		const select = this.select;
		const value = select.value;

		select.innerHTML = '';

		const createOption = ( name, optionValue ) => {

			const optionEl = document.createElement( 'option' );
			optionEl.value = name;
			optionEl.textContent = name;

			if ( name == value ) optionEl.selected = true;

			select.appendChild( optionEl );

			return optionEl;

		};

		if ( Array.isArray( options ) ) {

			options.forEach( opt => createOption( opt, opt ) );

		} else {

			Object.entries( options ).forEach( ( [ key, value ] ) => createOption( key, value ) );

		}

		this.options = options;

	}

	setValue( value ) {

		this.select.value = value;

		super.setValue( value );

		return this;

	}

	getValue() {

		const options = this.options;

		if ( Array.isArray( options ) ) {

			return options[ this.select.selectedIndex ];

		} else {

			return options[ this.select.value ];

		}

	}

}

class ValueColor extends Value {

	constructor( { value = '#ffffff' } ) {

		super();

		const colorInput = document.createElement( 'input' );
		colorInput.type = 'color';
		colorInput.value = this._getColorHex( value );
		this.colorInput = colorInput;

		this._value = value;

		colorInput.addEventListener( 'input', () => {

			const colorValue = colorInput.value;

			if ( this._value.isColor ) {

				this._value.setHex( parseInt( colorValue.slice( 1 ), 16 ) );

			} else {

				this._value = colorValue;

			}

			this.dispatchChange();

		} );

		this.domElement.appendChild( colorInput );

	}

	_getColorHex( color ) {

		if ( color.isColor ) {

			color = color.getHex();

		}

		if ( typeof color === 'number' ) {

			color = `#${ color.toString( 16 ) }`;

		} else if ( color[ 0 ] !== '#' ) {

			color = '#' + color;

		}

		return color;

	}

	getValue() {

		let value = this._value;

		if ( typeof value === 'string' ) {

			value = parseInt( value.slice( 1 ), 16 );

		}

		return value;

	}

}

class ValueButton extends Value {

	constructor( { text = 'Button', value = () => {} } ) {

		super();

		const button = document.createElement( 'button' );
		button.textContent = text;
		button.onclick = value;
		this.domElement.appendChild( button );

	}

}

class ValueTextArea extends Value {

	constructor( value ) {

		super();

		const input = document.createElement( 'textarea' );
		input.className = 'value-textarea';
		input.style.width = '100%';
		input.style.minHeight = '100px';
		input.style.resize = 'vertical';
		input.style.fontFamily = 'monospace';
		input.style.fontSize = '11px';
		input.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
		input.style.color = 'var(--text-primary)';
		input.style.border = '1px solid var(--border-color)';
		input.style.padding = '4px';
		input.spellcheck = false;

		input.value = value;

		input.onchange = () => {

			this.setValue( input.value );

		};

		input.onkeydown = ( e ) => {

			e.stopPropagation();

		};

		this.domElement.appendChild( input );
		this.input = input;

	}

	getValue() {

		return this.input.value;

	}

	setValue( value ) {

		if ( this.input.value !== value ) {

			this.input.value = value;

		}

		super.setValue( value );

		return this;

	}

}

class ValueJSONTextarea extends ValueTextArea {

	constructor( value ) {

		if ( typeof value === 'object' ) {

			value = JSON.stringify( value, null, '\t' );

		}

		super( value );

		//this.input.style.minHeight = '400px';

	}

	setValue( value ) {

		if ( typeof value === 'object' ) {

			value = JSON.stringify( value, null, '\t' );

		}

		super.setValue( value );

	}

}

export { Value, ValueNumber, ValueCheckbox, ValueSlider, ValueSelect, ValueColor, ValueButton, ValueTextArea, ValueJSONTextarea };
