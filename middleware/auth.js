import jwt from 'jsonwebtoken'

const authUser = async (req, res, next) => {
  const { token } = req.headers

  if (!token) {
    return res.json({ success: false, message: 'You need to log in to continue.' })
  }

  try {
    const token_decode = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = token_decode.id
    next()

  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
    if (error.name === 'TokenExpiredError') {
      return res.json({ success: false, message: 'Your session has expired. Please log in again.' });
    }
    return res.json({ success: false, message: 'Authentication failed. Please try again.' })
  }
}

export default authUser