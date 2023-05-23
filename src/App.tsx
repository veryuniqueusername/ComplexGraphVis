import math from 'customFunctions';
import { Ref, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
	PerspectiveCamera as DefaultCamera,
	Line,
	OrbitControls,
	Text,
} from '@react-three/drei';
import { OrbitControls as OrbitControlsType } from 'three-stdlib';
import { BufferAttribute, BufferGeometry, DoubleSide } from 'three';
import { Complex, complex, pi } from 'mathjs';
import { lerp } from 'three/src/math/MathUtils';
import Mathfield from 'Mathfield';
import { EditableMathField, StaticMathField, addStyles } from 'react-mathquill';
import evaluatex from 'evaluatex';
import { ComputeEngine } from '@cortex-js/compute-engine';

// TODO: IF NUMBER IS UNDEFINED, DON'T DRAW TRIGS

addStyles();

const ce = new ComputeEngine({ numericMode: 'complex' });

ce.set({ x: 5 });
let log = ce.parse('2+x\\times i').N();
if (log !== null) console.log(log.numericValue);

export default function App() {
	const [spin, setSpin] = useState(true);
	const [degMode, setDegMode] = useState(true);
	const [func, setFunc] = useState('');
	const [x, setX] = useState([-40, 40]);
	const [y, setY] = useState([-40, 40]);
	const [z, setZ] = useState([-40, 40]);
	const [step, setStep] = useState(1);
	const [points, setPoints] = useState<Complex[][]>([[]]);
	const [meshes, setMeshes] = useState<any>([]);
	const [cameraX, setCameraX] = useState(50);
	const [cameraY, setCameraY] = useState(20);
	const [cameraZ, setCameraZ] = useState(50);

	const bufferGeo = useRef<BufferGeometry>(null!);
	const posRef = useRef<BufferAttribute>(null!);
	const normalRef = useRef<BufferAttribute>(null!);
	const colorRef = useRef<BufferAttribute>(null!);
	const indexRef = useRef<BufferAttribute>(null!);
	const cameraRef = useRef<OrbitControlsType>(null!);

	const xFaceCount = (x[1] - x[0]) / step;
	const yFaceCount = (y[1] - y[0]) / step;

	function evaluate() {
		let xVertCount: number = xFaceCount + 1;
		let yVertCount: number = yFaceCount + 1;
		let newPoints: Complex[][] = [];
		for (let j = 0; j < xVertCount; j++) {
			newPoints.push([]);
			for (let k = 0; k < yVertCount; k++) {
				newPoints[j].push(complex(0, 0));
			}
		}
		let fn = ce.parse(func);
		for (let j = 0; j < xVertCount; j++) {
			for (let k = 0; k < yVertCount; k++) {
				let scope = {
					a: j * step + x[0],
					b: k * step + y[0],
				};
				ce.set(scope);
				let res = fn.simplify().N().numericValue;
				if (res === null) {
					// console.log({
					// 	a: scope.a,
					// 	b: scope.b,
					// 	res: res,
					// 	simple: fn.simplify().numericValue,
					// 	fnNum: fn.numericValue,
					// 	fn: fn,
					// 	func: func,
					// });
					console.log('null');
					newPoints[j][k] = complex(0, 0);
				} else if (typeof res === 'number') {
					if (res === Infinity) {
						console.log('infinity');
					}
					newPoints[j][k] = complex(res, 0);
				} else if (isComplex(res)) {
					newPoints[j][k] = complex(res.re, res.im);
				} else {
					console.log('wrong type, not complex');
					console.log(res);
					newPoints[j][k] = complex(0, 0);
				}
			}
		}
		setPoints(newPoints);
	}

	useLayoutEffect(() => {
		if (posRef.current === null) return;

		let newPoints = points.slice(0, -1);
		newPoints.forEach((arr, i, parent) => (newPoints[i] = arr.slice(0, -1)));

		const offsetX = x[0];
		const offsetY = y[0];

		const vertices: number[] = [];
		const normals: number[] = [];
		const colors: number[] = [];
		const indices: number[] = [];

		points.forEach((arr, i, parent) =>
			arr.forEach((val, j) => {
				vertices.push(i * step + offsetX, points[i][j].re, j * step + offsetY);
				normals.push(...[0, 1, 0]);
				if (degMode) {
					let deg = math.arg(points[i][j]) / (2 * pi);
					if (deg < 0) deg += 1;
					colors.push(...HSVtoRGB(deg, 1, 1));
				} else {
					colors.push(
						...HSVtoRGB(0, 0, (points[i][j].im + z[1]) / (z[1] - z[0]))
					);
				}
			})
		);

		newPoints.forEach((arr, i, parent) =>
			arr.forEach((val, j) => {
				indices.push(
					...[
						i * (arr.length + 1) + j,
						i * (arr.length + 1) + j + 1,
						(i + 1) * (arr.length + 1) + j,
						i * (arr.length + 1) + j + 1,
						(i + 1) * (arr.length + 1) + j,
						(i + 1) * (arr.length + 1) + j + 1,
					]
				);
			})
		);

		posRef.current.array = new Float32Array(vertices);
		posRef.current.count = vertices.length / 3;
		normalRef.current.array = new Float32Array(normals);
		normalRef.current.count = normals.length / 3;
		colorRef.current.array = new Float32Array(colors);
		colorRef.current.count = colors.length / 3;
		indexRef.current.array = new Uint16Array(indices);
		indexRef.current.count = indices.length;
		posRef.current.needsUpdate = true;
		normalRef.current.needsUpdate = true;
		colorRef.current.needsUpdate = true;
		indexRef.current.needsUpdate = true;

		bufferGeo.current.computeBoundingBox();
		bufferGeo.current.computeBoundingSphere();
		// bufferGeo.current.computeVertexNormals();

		return () => {};
	}, [points]);

	return (
		<>
			<div id="functions">
				<button id="play-button" onClick={() => setSpin(!spin)}>
					<span className="material-symbols-sharp">
						{spin ? 'pause' : 'play_arrow'}
					</span>
				</button>
				<StaticMathField>{'f\\left(x\\right)='}</StaticMathField>
				<EditableMathField
					latex={func}
					onChange={(field) => setFunc(field.latex())}
				/>
				<button onClick={() => evaluate()}>Eval</button>
				<button onClick={() => setDegMode(!degMode)}>Change Mode</button>
			</div>
			<div id="canvas-container">
				<Canvas camera={{ far: 100000 }}>
					<OrbitControls ref={cameraRef} />
					<ambientLight intensity={0.5} />
					{/* <directionalLight intensity={1} /> */}
					<mesh>
						<sphereGeometry args={[0.5, 10, 10]} />
						<meshBasicMaterial color={[0, 0, 0]} />
						<Line
							points={[
								[x[0], 0, 0],
								[x[1], 0, 0],
							]}
							dashed={true}
							dashSize={1}
							dashScale={5}
							lineWidth={2}
						/>
						<DynamicText position={[x[0], 0, 0]} cameraRef={cameraRef}>
							-a
						</DynamicText>
						<DynamicText position={[x[1], 0, 0]} cameraRef={cameraRef}>
							+a
						</DynamicText>
						<Line
							points={[
								[0, 0, y[0]],
								[0, 0, y[1]],
							]}
							dashed={true}
							dashSize={1}
							dashScale={5}
							lineWidth={2}
						/>
						<DynamicText position={[0, 0, y[0]]} cameraRef={cameraRef}>
							-b
						</DynamicText>
						<DynamicText position={[0, 0, y[1]]} cameraRef={cameraRef}>
							+b
						</DynamicText>
						<Line
							points={[
								[0, z[0], 0],
								[0, z[1], 0],
							]}
							dashed={true}
							dashSize={1}
							dashScale={5}
							lineWidth={2}
						/>
						<DynamicText position={[0, z[0], 0]} cameraRef={cameraRef}>
							-f(z)
						</DynamicText>
						<DynamicText position={[0, z[1], 0]} cameraRef={cameraRef}>
							+f(z)
						</DynamicText>
					</mesh>
					<mesh>
						<meshStandardMaterial vertexColors side={DoubleSide} />
						<bufferGeometry ref={bufferGeo}>
							<bufferAttribute
								ref={posRef}
								attach={'attributes-position'}
								array={
									new Float32Array((xFaceCount + 1) * (yFaceCount + 1) * 3)
								}
								count={4}
								itemSize={3}
							/>
							<bufferAttribute
								ref={normalRef}
								attach="attributes-normal"
								array={
									new Float32Array((xFaceCount + 1) * (yFaceCount + 1) * 3)
								}
								count={4}
								itemSize={3}
							/>
							<bufferAttribute
								ref={colorRef}
								attach="attributes-color"
								array={
									new Float32Array((xFaceCount + 1) * (yFaceCount + 1) * 3)
								}
								count={4}
								itemSize={3}
							/>
							<bufferAttribute
								ref={indexRef}
								attach={'index'}
								array={new Uint16Array(xFaceCount * yFaceCount * 6)}
								count={6}
								itemSize={1}
							/>
						</bufferGeometry>
					</mesh>
				</Canvas>
			</div>
		</>
	);
}

function DynamicText({
	position,
	children,
	cameraRef,
}: {
	position: any;
	children: any;
	cameraRef: React.MutableRefObject<OrbitControlsType>;
}) {
	const ref = useRef<any>(null!);

	useFrame((state, delta) => {
		if (cameraRef.current === null) return;
		// console.log(cameraRef.current.position0);
		ref.current.rotation;
	});

	return (
		<Text
			ref={ref}
			color="black"
			anchorX="center"
			anchorY="middle"
			position={position}
		>
			{children}
		</Text>
	);
}

function HSVtoRGB(h: number, s: number, v: number) {
	var r: number,
		g: number,
		b: number,
		i: number,
		f: number,
		p: number,
		q: number,
		t: number;
	i = Math.floor(h * 6);
	f = h * 6 - i;
	p = v * (1 - s);
	q = v * (1 - f * s);
	t = v * (1 - (1 - f) * s);
	switch (i % 6) {
		case -1:
		case 0:
			(r = v), (g = t), (b = p);
			break;
		case 1:
			(r = q), (g = v), (b = p);
			break;
		case 2:
			(r = p), (g = v), (b = t);
			break;
		case 3:
			(r = p), (g = q), (b = v);
			break;
		case 4:
			(r = t), (g = p), (b = v);
			break;
		case 5:
		case 6:
			(r = v), (g = p), (b = q);
			break;
		default:
			console.log('default HSVtoRGB');
			(r = 1), (b = 0), (g = 0);
			break;
	}
	return [r, g, b];
}

function isComplex(num: any): num is Complex {
	return (num as Complex).re !== undefined;
}
