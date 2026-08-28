// Encaminha rejeições de promises dos controllers para o middleware de erro
// do Express, evitando repetir try/catch em cada rota.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = asyncHandler;
