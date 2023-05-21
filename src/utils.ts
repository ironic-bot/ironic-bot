export function calculateXpNeededForLevel(level: number): number {
	return 5 * Math.pow(level, 2) + 50 * level + 100;
}

export function getRandomNumberBetween(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}
