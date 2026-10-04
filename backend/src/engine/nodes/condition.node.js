const execute = async (config, context) => {
  const { field, operator, value } = config;
  const actualValue = field.split(".").reduce((obj, key) => obj?.[key], context);

  let result;
  switch (operator) {
    case "equals": result = actualValue === value; break;
    case "not_equals": result = actualValue !== value; break;
    case "greater_than": result = actualValue > value; break;
    case "less_than": result = actualValue < value; break;
    case "contains": result = String(actualValue).includes(value); break;
    default: throw new Error(`Unknown operator: ${operator}`);
  }

  return { result };
};

module.exports = { execute };