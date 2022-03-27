import { ValueBinder } from "../../src/shared-internals.js";
import {useState} from "./useState.js";

/**
 * Tests on every new value, whether it matches a certain condition, useful for boolean checks.
 * @param initialValue The value to initialize with
 * @param validation A function that checks whether a new value passes the validation
 * @returns [{value, lastValidValue, valid}, changeValue]
 */
function useValidatedState(initialValue : any, validation : Function) : [{value: ValueBinder, lastValidValue: ValueBinder, valid: ValueBinder}, Function] {
	const [value, setValue] = useState(initialValue);
	const [lastValidValue, setLastValidValue] = useState(validation(initialValue) ? initialValue : undefined, false);
	const [valid, setValid] = useState(validation(initialValue), false)

	const changeValue = (newValue) => {
		if (validation(newValue)) {
			setLastValidValue(newValue);
			setValid(true);
		} else {
			setValid(false);
		}

		setValue(newValue);
	}

	return [{
		value,
		lastValidValue,
		valid
	}, changeValue]
}

export {useValidatedState};