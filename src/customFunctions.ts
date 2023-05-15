import { create, all, log, sign, asin, acos, atan } from 'mathjs';
const math = create(all);

function lg(a): number {
	return log(a, 10);
}
lg.transform = function (a) {
	const res = lg(a);
	return res;
};

function ln(a): number {
	return log(a);
}
ln.transform = function (a) {
	const res = ln(a);
	return res;
};

function sgn(a): number {
	return sign(a);
}
sgn.transform = function (a) {
	const res = sgn(a);
	return res;
};

function arcsin(a): number {
	return asin(a);
}
arcsin.transform = function (a) {
	const res = arcsin(a);
	return res;
};

function arccos(a): number {
	return acos(a);
}
arccos.transform = function (a) {
	const res = arccos(a);
	return res;
};

function arctan(a): number {
	return atan(a);
}
arctan.transform = function (a) {
	const res = arctan(a);
	return res;
};

math.import({
	lg: lg,
	ln: ln,
	sgn: sgn,
	arcsin: arcsin,
	arccos: arccos,
	arctan: arctan,
});

export default math;
