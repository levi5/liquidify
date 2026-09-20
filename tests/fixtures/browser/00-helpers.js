window.scenarios = []

const wait = () => new Promise((resolve) => setTimeout(resolve, 100))

const check = (condition, message) => {
  if (!condition) throw new Error(message)
}
