import React, {Component} from 'react';

class MessageList extends Component {

  render() {
    return (
      <div className='message-list'>
        {this.props.messages.map((message, index) => {
          return (
            <div className='message' key={index}>
              <audio src={message} controls={true} />
            </div>
          );
        })}
      </div>
    );
  }
}

export default MessageList;