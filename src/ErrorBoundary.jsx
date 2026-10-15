import { Component } from "react";

export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  retry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      // A render failure should not turn a cat search into a blank, haunted page.
      return (
        <div role="alert">
          <p>Something went wrong.</p>
          <button type="button" onClick={this.retry}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
