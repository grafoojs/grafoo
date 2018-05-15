export default function GrafooProvider({ client }) {
  this.getChildContext = () => ({ client });
}

GrafooProvider.prototype.render = props => props.children[0];
