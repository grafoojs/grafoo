export default function Provider({ client }) {
  this.getChildContext = () => ({ client });
}

Provider.prototype.render = props => props.children[0];
