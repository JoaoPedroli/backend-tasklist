import * as yup from 'yup';
import User from '../models/User';

class UserController {
  async store(req, res) {
    const schema = yup.object().shape({
      name: yup.string().required(),
      email: yup.string().email().required(),
      password: yup.string().min(6).required(),
    })

    if( !(await schema.isValid(req.body)) ) {
      return res.status(400).json({ error: 'Falha na validação' });
    }

    const userExists = await User.findOne({
      where: { email: req.body.email },
    });

    if(userExists) {
      return res.status(400).json({ error: 'Usuário já existe.' });
    }

    const { id, name, email } = await User.create(req.body);

    return res.status(201).json({
      id, name, email
    });
  }

  async update(req, res) {
    const schema = yup.object().shape({
      name: yup.string(),
      email: yup.string().email(),
      oldPassword: yup.string().min(6),

      password: yup.string().min(6)
        .when('oldPassword', (oldPassword, field) =>
          oldPassword ? field.required() : field
        ),
      confirmPassword: yup.string()
        .when('password', (password, field) =>
          password ? field.required().oneOf([ yup.ref('password') ]) : field
        ),
    })

    if( !(await schema.isValid(req.body)) ) {
      return res.status(400).json({ error: 'Falha na validação' });
    }

    const { email, oldPassword } = req.body;

    const user = await User.findByPk(req.userId);

    if(email !== user.email) {
      const userExists = await User.findOne({
        where: { email: req.body.email },
      });

      if(userExists) {
        return res.status(400).json({ error: 'Usuário já existe.' });
      }
    }

    if(oldPassword && !( await user.checkPassword(oldPassword))) {
      return res.status(401).json({ error: 'Senha incorreta.'});
    }

    const { id, name } = await user.update(req.body);

    return res.json({
      id, name, email,
    });
  }
}

export default new UserController();
