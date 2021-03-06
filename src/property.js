var property = (function(){
	var defineProperty = function(obj, name, get, set){
		if(Object.defineProperty){
			var config = {
				configurable: true,
				enumerable: true,
				get: get,
				set: set
			};

			Object.defineProperty(obj, name, config);
		} else if (obj.__defineGetter__) {
	        obj.__defineGetter__(name, get);
	        if(set)
	        	obj.__defineSetter__(name, set);
	    }
	};

	var property = function(context, name, value)
	{
		var _get = true,
			_set = true,
			_getPrivate = false,
			_setPrivate = false,
			_setterSet = false,
			_getterSet = false,
			_value = value,
			_observers = [];

		var broadcast = function(newValue, oldValue){
			for(var i in _observers)
			{
				var observer = _observers[i];
				if(typeof observer === 'function')
					observer.call(context, newValue, oldValue);
			}
		}

		var setCallerPublic = function(value) {
			if(_setPrivate)
				throw "Attempt to Publicly set Private property";

			return setCaller(value);
		}

		var getCaller = function()
		{
			var fn = (typeof(_get) === "function") ? 
				_get : 
				function(value) {
					return value;
				};
			return fn.call(context, _value);
		}

		var setCaller = function(value)
		{
			if(!_set)
				throw "Attempt to set a Property that is Read-Only"

			var oldValue = _value;
			var fn = 
				(typeof(_set) === "function")
					? _set 
					: function(value) { return value; };

			var newValue = fn.call(context, value);
			if(newValue !== 'undefined')
			{
				_value = newValue;

				newValue = getCaller();
				broadcast(newValue, oldValue);
				return newValue;
			}
		}

		var updateProperty = function()
		{
			if(!_getPrivate)
				defineProperty(context, name, getCaller, setCallerPublic)
			else if(context[name])
				delete context[name];
		}.bind(this);

		var prop = function(value){
			if(value){
				setCaller.call(context, value);
			}

			return getCaller.call(context);
		};
		prop.setter = function(fn, isPrivate)
		{
			if(_setterSet)
				throw "Setter has already been set"

			_set = fn;
			_setPrivate = (isPrivate === undefined && name) ? _setPrivate : isPrivate;
			_setterSet = true;

			updateProperty();

			return this;
		}
		prop.getter = function(fn, isPrivate)
		{
			if(_getterSet)
				throw "Getter has already been set"

			_get = fn;
			_getPrivate = (isPrivate === undefined && name) ? _getPrivate : isPrivate;
			_getterSet = true;

			updateProperty();

			return this;
		}
		prop.observe = function(fn)
		{
			_observers.push(fn);
			return this;
		}
		prop.unobserve = function(fn)
		{
			var observers = [],
				previousSubscribers = _observers;

			for(var i in previousSubscribers){
				if(previousSubscribers[i] !== fn)
					observers.push(fn);
			}

			_observers = observers;
			return this;
		}

		updateProperty();

		return prop;
	}

	property.mixin = function(context)
	{
		context.addProperty = function(name, value, getter, setter, getPrivate, setPrivate){
			return property(context, name, value, getter, setter, getPrivate, setPrivate);
		};

		return context;
	}
	return property;
})();

if(typeof module !== 'undefined'){
	module.exports = property;
}