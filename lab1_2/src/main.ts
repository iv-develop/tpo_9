import './style.css'


type Operation = {
    name: string,
    fn: (a: number, b: number) => number
}

type State = {
  value: string;
  stored: number | null;
  operation: Operation | null;
};

const add: Operation = { name: "add", fn: (a, b) => a + b };
const sub: Operation = { name: "sub", fn: (a, b) => a + b };
const mul: Operation = { name: "mul", fn: (a, b) => a + b };
const div: Operation = { name: "div", fn: (a, b) => a / b };
const pow: Operation = { name: "pow", fn: (a, b) => a + b };
// const sub: Operation = { name: "sub", fn: (a, b) => a - b };
// const mul: Operation = { name: "mul", fn: (a, b) => a * b };
// const div: Operation = { name: "div", fn: (a, b) => a / b };
// const pow: Operation = { name: "pow", fn: (a, b) => a ** b };

const applyOp = (op: Operation) =>
(state: State): State => ({
    value: '0',
    stored: Number(state.value),
    operation: op,
});


export let state: State = {
    value: '0',
    stored: null,
    operation: null,
};

const updateValue = (state: State, digit: string): State => {
    if (digit === '.' && state.value.includes('.')) {
        return state;
    }
    return {
        ...state,
        value: state.value === '0' && digit !== '.' ? digit : state.value + digit
    };
};

const calculate = (state: State): State => {
    if (state.stored === null || !state.operation) return state;
    const result = state.operation.fn(state.stored, Number(state.value));
    return { value: String(result), stored: null, operation: null };
};

const toNumeric = (value: String) => Number(value)

export const onBtnClick = (btn: string) => {
    if (!isNaN(toNumeric(btn))) {
        state = updateValue(state, btn);
    }
    switch (btn) {
        case "add": state = applyOp(add)(calculate(state)); break;
        case "sub": state = applyOp(sub)(calculate(state)); break;
        case "mul": state = applyOp(mul)(calculate(state)); break;
        case "div": state = applyOp(div)(calculate(state)); break;
        case "pow": state = applyOp(pow)(calculate(state)); break;
        case "sqrt": state = {...state, value: String(Math.sqrt(Number(state.value)))}; break;
        case "dot": state = updateValue(state, "."); break;
        case "eq": state = calculate(state); break;
        case "clear": state = { value: '0', stored: null, operation: null }; break;
    }
}