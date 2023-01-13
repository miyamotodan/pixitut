
// Some helpers, just for fun.
function randrange(min, max) { return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) + Math.ceil(min); }
function randcolor() { return '0x' + Math.floor(Math.random() * 16777215).toString(16) }

const getLogarithmicScaledValue = (x, X0, X1, xmin, xmax) => {
    let b = (X1 - X0) / Math.log1p(xmax / xmin);
    let a = X0 - b * Math.log1p(xmin);
    let res = a + b * Math.log1p(x);
    //console.log('[',xmin,',',xmax,'] ',x,' --> ',res,' [',X0,',',X1,']');
    return res;
}

export {randcolor, randrange, 
    getLogarithmicScaledValue
}

