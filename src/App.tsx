import { useMemo, useState } from 'react';

const MAX_DEGREE = 90;
const MAX_SPOTLIGHTS = 4;
const ARENA_RADIUS = 255;

const BEAM_COLORS = ['#00f5d4', '#ff7a59', '#ffd23f', '#8cff98'] as const;

const toRadians = (angle: number) => (angle * Math.PI) / 180;

const polarToCartesian = (radius: number, angle: number) => {
	const radians = toRadians(angle);

	return {
		x: radius * Math.cos(radians),
		y: radius * Math.sin(radians),
	};
};

const createBeamPath = (radius: number, startAngle: number, endAngle: number) => {
	const startPoint = polarToCartesian(radius, startAngle);
	const endPoint = polarToCartesian(radius, endAngle);
	const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

	return [
		'M 0 0',
		`L ${startPoint.x.toFixed(2)} ${startPoint.y.toFixed(2)}`,
		`A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endPoint.x.toFixed(2)} ${endPoint.y.toFixed(2)}`,
		'Z',
	].join(' ');
};

export default function App() {
	const [degree, setDegree] = useState(45);
	const [spotlightCount, setSpotlightCount] = useState(2);
	const [isSpinning, setIsSpinning] = useState(true);

	const beams = useMemo(() => {
		const spacing = 360 / spotlightCount;

		return Array.from({ length: spotlightCount }, (_, index) => {
			const centerAngle = -90 + spacing * index;
			const startAngle = centerAngle - degree / 2;
			const endAngle = centerAngle + degree / 2;

			return {
				id: index,
				color: BEAM_COLORS[index],
				path: createBeamPath(ARENA_RADIUS, startAngle, endAngle),
			};
		});
	}, [degree, spotlightCount]);

	const coverageDegrees = Math.min(360, degree * spotlightCount);
	const coveragePercent = (coverageDegrees / 360) * 100;
	const roundedCoverage = Math.round(coveragePercent * 10) / 10;
	const blindSpot = 360 - coverageDegrees;

	return (
		<main className="simulator">
			<section className="panel">
				<p className="kicker">Tower Idle Utility</p>
				<h1>Spotlight Coverage Simulator</h1>
				<p className="description">
					Preview how your cone angle and spotlight count affect map coverage.
				</p>

				<div className="control">
					<div className="control-header">
						<span>Beam Degree</span>
						<span className="control-value">{degree}&deg;</span>
					</div>
					<input
						type="range"
						min={1}
						max={MAX_DEGREE}
						step={1}
						value={degree}
						onChange={(event) => setDegree(Number(event.target.value))}
						aria-label="Spotlight beam degree"
					/>
					<p className="hint">Maximum beam width: {MAX_DEGREE}&deg;</p>
				</div>

				<div className="control">
					<div className="control-header">
						<span>Number Of Spotlights</span>
						<span className="control-value">{spotlightCount}</span>
					</div>
					<div className="spotlight-picker" role="group" aria-label="Number of spotlights">
						{Array.from({ length: MAX_SPOTLIGHTS }, (_, index) => {
							const value = index + 1;
							const isActive = value === spotlightCount;

							return (
								<button
									key={value}
									type="button"
									className={`spotlight-btn${isActive ? ' active' : ''}`}
									onClick={() => setSpotlightCount(value)}
								>
									{value}
								</button>
							);
						})}
					</div>
					<p className="hint">Maximum supported: {MAX_SPOTLIGHTS} spotlights</p>
				</div>

				<div className="control">
					<div className="toggle-row">
						<div className="toggle-copy">
							<span className="toggle-label">Spin Animation</span>
							<p className="hint">Keep spotlights rotating continuously</p>
						</div>
						<label className="switch">
							<input
								type="checkbox"
								checked={isSpinning}
								onChange={(event) => setIsSpinning(event.target.checked)}
								aria-label="Toggle spotlight spinning animation"
							/>
							<span className="switch-track">
								<span className="switch-thumb" />
							</span>
						</label>
					</div>
				</div>

				<div className="stats">
					<div className="stat-row">
						<span>Current Coverage</span>
						<strong>{roundedCoverage}%</strong>
					</div>
					<div className="meter">
						<span style={{ width: `${coveragePercent}%` }} />
					</div>
					<div className="stat-grid">
						<p>
							<span>Covered Arc</span>
							<strong>{coverageDegrees}&deg; / 360&deg;</strong>
						</p>
						<p>
							<span>Blind Spot</span>
							<strong>{blindSpot}&deg;</strong>
						</p>
					</div>
				</div>
			</section>

			<section className="scene" aria-label="Coverage Preview">
				<svg viewBox="-320 -320 640 640" role="img" aria-labelledby="coverage-title coverage-desc">
					<title id="coverage-title">Spotlight Coverage Map</title>
					<desc id="coverage-desc">
						Each colored wedge shows one spotlight beam from the central tower.
					</desc>

					<defs>
						{beams.map((beam) => (
							<radialGradient
								key={`gradient-${beam.id}`}
								id={`beam-gradient-${beam.id}`}
								gradientUnits="userSpaceOnUse"
								cx="0"
								cy="0"
								r={ARENA_RADIUS}
							>
								<stop offset="0%" stopColor={beam.color} stopOpacity="0.52" />
								<stop offset="100%" stopColor={beam.color} stopOpacity="0.08" />
							</radialGradient>
						))}
					</defs>

					<circle r="290" className="arena-glow" />
					<circle r={ARENA_RADIUS + 22} className="arena-rim" />
					<circle r={ARENA_RADIUS} className="arena-core" />

					<g className={`beam-rotation${isSpinning ? '' : ' is-paused'}`}>
						{beams.map((beam) => (
							<path
								key={beam.id}
								d={beam.path}
								fill={`url(#beam-gradient-${beam.id})`}
								stroke={beam.color}
								strokeOpacity="0.55"
								strokeWidth="1.2"
							/>
						))}
					</g>

					<circle r="36" className="tower-core" />
					<circle r="16" className="tower-top" />
				</svg>
			</section>
		</main>
	);
}
