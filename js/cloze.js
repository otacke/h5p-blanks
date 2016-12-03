(function ($, Blanks) {

  /**
   * Simple private class for keeping track of clozes.
   *
   * @class H5P.Blanks.Cloze
   * @param {string} answer
   * @param {Object} behaviour Behaviour for the task
   * @param {string} defaultUserAnswer
   * @param {Object} l10n Localized texts
   * @param {string} l10n.solutionLabel Assistive technology label for cloze solution
   * @param {string} l10n.inputLabel Assistive technology label for cloze input
   * @param {string} l10n.inputHasTipLabel Assistive technology label for input with tip
   * @param {string} l10n.tipLabel Label for tip icon
   */
  Blanks.Cloze = function (solution, behaviour, defaultUserAnswer, l10n) {
    var self = this;
    var $input, $wrapper;
    var answers = solution.solutions;
    var answer = answers.join(Blanks.ALTERNATIVE_IDENTIFIER);
    var tip = solution.tip;
    var checkedAnswer = null;
    var inputLabel = l10n.inputLabel;

    if (behaviour.caseSensitive !== true) {
      // Convert possible solutions into lowercase
      for (var i = 0; i < answers.length; i++) {
        answers[i] = answers[i].toLowerCase();
      }
    }

    /**
     * Check if the answer is correct.
     *
     * @private
     * @param {string} answered
     */
    var correct = function (answered) {
      if (behaviour.caseSensitive !== true) {
        answered = answered.toLowerCase();
        var regexpFlag = 'i';
      }

      for (var i = 0; i < answers.length; i++) {
        // Regular Expression
        if (answers[i].startsWith(Blanks.REGEXP_IDENTIFIER_START) && answers[i].endsWith(Blanks.REGEXP_IDENTIFIER_END)) {
          try {
            var expression = new RegExp(answers[i].slice(Blanks.REGEXP_IDENTIFIER_START.length, answers[i].indexOf(Blanks.REGEXP_IDENTIFIER_END)), regexpFlag);
          }
          catch(error) {
            return false;
          }
          if (expression.test(answered) === true) {
            return true;
          }
        }
        // Normal answer
        else {
          if (answered === answers[i]) {
            return true;
          }
        }
      }
      return false;
    };

    /**
     * Check if filled out.
     *
     * @param {boolean}
     */
    this.filledOut = function () {
      var answered = this.getUserAnswer();
      // Blank can be correct and is interpreted as filled out.
      return (answered !== '' || correct(answered));
    };

    /**
     * Check the cloze and mark it as wrong or correct.
     */
    this.checkAnswer = function () {
      checkedAnswer = this.getUserAnswer();
      var isCorrect = correct(checkedAnswer);
      if (isCorrect) {
        $wrapper.addClass('h5p-correct');
        $input.attr('disabled', true)
          .attr('aria-label', inputLabel + '. ' + l10n.answeredCorrectly);
      }
      else {
        $wrapper.addClass('h5p-wrong');
        $input.attr('aria-label', inputLabel + '. ' + l10n.answeredIncorrectly);
      }
    };

    /**
     * Disables input.
     * @method disableInput
     */
    this.disableInput = function () {
      this.toggleInput(false);
    };

    /**
     * Enables input.
     * @method enableInput
     */
    this.enableInput = function () {
      this.toggleInput(true);
    };

    /**
     * Toggles input enable/disable
     * @method toggleInput
     * @param  {boolean}   enabled True if input should be enabled, otherwise false
     */
    this.toggleInput = function (enabled) {
      $input.attr('disabled', !enabled);
    };

    /**
     * Show the correct solution.
     */
    this.showSolution = function () {
      if (correct(this.getUserAnswer())) {
        return; // Only for the wrong ones
      }

      $('<span aria-hidden="true" class="h5p-correct-answer"> ' + answer + '</span>').insertAfter($wrapper);
      $input.attr('disabled', true);
      var ariaLabel = inputLabel + '. ' +
        l10n.solutionLabel + ' ' + answer + '. ' +
        l10n.answeredIncorrectly;

      $input.attr('aria-label', ariaLabel);
    };

    /**
     * @returns {boolean}
     */
    this.correct = function () {
      return correct(this.getUserAnswer());
    };

    /**
     * Set input element.
     *
     * @param {H5P.jQuery} $element
     * @param {function} afterCheck
     * @param {function} afterFocus
     * @param {number} clozeIndex Index of cloze
     * @param {number} totalCloze Total amount of clozes in blanks
     */
    this.setInput = function ($element, afterCheck, afterFocus, clozeIndex, totalCloze) {
      $input = $element;
      $wrapper = $element.parent();
      inputLabel = inputLabel.replace('@num', (clozeIndex + 1))
        .replace('@total', totalCloze);

      // Add tip if tip is set
      if(tip !== undefined && tip.trim().length > 0) {
        $wrapper.addClass('has-tip')
          .append(H5P.JoubelUI.createTip(tip, {
            tipLabel: l10n.tipLabel
          }));
        inputLabel += '. ' + l10n.inputHasTipLabel;
      }

      $input.attr('aria-label', inputLabel);

      if (afterCheck !== undefined) {
        $input.blur(function () {
          if (self.filledOut()) {
            // Check answers
            if (!behaviour.enableRetry) {
              self.disableInput();
            }
            self.checkAnswer();
            afterCheck.apply(self);
          }
        });
      }
      $input.keyup(function () {
        if (checkedAnswer !== null && checkedAnswer !== self.getUserAnswer()) {
          // The Answer has changed since last check
          checkedAnswer = null;
          $wrapper.removeClass('h5p-wrong');
          $input.attr('aria-label', inputLabel);
          if (afterFocus !== undefined) {
            afterFocus();
          }
        }
      });
    };

    /**
     * @returns {string} Cloze html
     */
    this.toString = function () {
      var extra = defaultUserAnswer ? ' value="' + defaultUserAnswer + '"' : '';
      var result = '<span class="h5p-input-wrapper"><input type="text" class="h5p-text-input" autocapitalize="off"' + extra + '></span>';
      self.length = result.length;
      return result;
    };

    /**
     * @returns {string} Trimmed answer
     */
    this.getUserAnswer = function () {
      return H5P.trim($input.val());
    };

    /**
     * @returns {string} Answer
     */
    this.getUserInput = function () {
      return $input.val();
    };

    /**
     * @param {string} text New input text
     */
    this.setUserInput = function (text) {
      $input.val(text);
    };

    /**
     * Resets aria label of input field
     */
    this.resetAriaLabel = function () {
      $input.attr('aria-label', inputLabel);
    }
  };

})(H5P.jQuery, H5P.Blanks);
