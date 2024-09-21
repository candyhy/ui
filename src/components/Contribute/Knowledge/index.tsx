'use client';
import React, { useEffect, useState } from 'react';
import './knowledge.css';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { ActionGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { Form } from '@patternfly/react-core/dist/dynamic/components/Form';
import { getGitHubUsername } from '../../../utils/github';
import { useSession } from 'next-auth/react';
import AuthorInformation from './AuthorInformation/AuthorInformation';
import KnowledgeInformation from './KnowledgeInformation/KnowledgeInformation';
import FilePathInformation from './FilePathInformation/FilePathInformation';
import DocumentInformation from './DocumentInformation/DocumentInformation';
import AttributionInformation from './AttributionInformation/AttributionInformation';
import Submit from './Submit/Submit';
import { Breadcrumb } from '@patternfly/react-core/dist/dynamic/components/Breadcrumb';
import { BreadcrumbItem } from '@patternfly/react-core/dist/dynamic/components/Breadcrumb';
import { PageBreadcrumb } from '@patternfly/react-core/dist/dynamic/components/Page';
import { PageGroup } from '@patternfly/react-core/dist/dynamic/components/Page';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import KnowledgeDescriptionContent from './KnowledgeDescription/KnowledgeDescriptionContent';
import KnowledgeSeedExample from './KnowledgeSeedExample/KnowledgeSeedExample';
import { checkKnowledgeFormCompletion } from './validation';
import { ValidatedOptions } from '@patternfly/react-core/dist/esm/helpers/constants';
import { DownloadDropdown } from './DownloadDropdown/DownloadDropdown';
import { ViewDropdown } from './ViewDropdown/ViewDropdown';
import { KnowledgeYamlData } from '@/types'; // Import KnowledgeYamlData type
import KnowledgeYamlFileUpload from './ImportYaml/KnowledgeYamlFileUpload';

export interface QuestionAndAnswerPair {
  immutable: boolean;
  question: string;
  isQuestionValid: ValidatedOptions;
  questionValidationError?: string;
  answer: string;
  isAnswerValid: ValidatedOptions;
  answerValidationError?: string;
}

export interface SeedExample {
  immutable: boolean;
  isExpanded: boolean;
  context: string;
  isContextValid: ValidatedOptions;
  validationError?: string;
  questionAndAnswers: QuestionAndAnswerPair[];
}

export interface KnowledgeFormData {
  email: string;
  name: string;
  submissionSummary: string;
  domain: string;
  documentOutline: string;
  filePath: string;
  seedExamples: SeedExample[];
  knowledgeDocumentRepositoryUrl: string;
  knowledgeDocumentCommit: string;
  documentName: string;
  titleWork: string;
  linkWork: string;
  revision: string;
  licenseWork: string;
  creators: string;
}

export interface ActionGroupAlertContent {
  title: string;
  message: string;
  url?: string;
  success: boolean;
}

export const KnowledgeForm: React.FunctionComponent = () => {
  const { data: session } = useSession();
  const [githubUsername, setGithubUsername] = useState<string>('');
  // Author Information
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');

  // Knowledge Information
  const [submissionSummary, setSubmissionSummary] = useState<string>('');
  const [domain, setDomain] = useState<string>('');
  const [documentOutline, setDocumentOutline] = useState<string>('');

  // File Path Information
  const [filePath, setFilePath] = useState<string>('');

  const [knowledgeDocumentRepositoryUrl, setKnowledgeDocumentRepositoryUrl] = useState<string>('');
  const [knowledgeDocumentCommit, setKnowledgeDocumentCommit] = useState<string>('');
  // This used to be 'patterns' but I am not totally sure what this variable actually is...
  const [documentName, setDocumentName] = useState<string>('');

  // Attribution Information
  // State
  const [titleWork, setTitleWork] = useState<string>('');
  const [linkWork, setLinkWork] = useState<string>('');
  const [revision, setRevision] = useState<string>('');
  const [licenseWork, setLicenseWork] = useState<string>('');
  const [creators, setCreators] = useState<string>('');

  const [actionGroupAlertContent, setActionGroupAlertContent] = useState<ActionGroupAlertContent | undefined>();

  const [disableAction, setDisableAction] = useState<boolean>(true);
  const [reset, setReset] = useState<boolean>(false);

  const emptySeedExample: SeedExample = {
    immutable: true,
    isExpanded: false,
    context: '',
    isContextValid: ValidatedOptions.default,
    questionAndAnswers: [
      {
        immutable: true,
        question: '',
        isQuestionValid: ValidatedOptions.default,
        answer: '',
        isAnswerValid: ValidatedOptions.default
      },
      {
        immutable: true,
        question: '',
        isQuestionValid: ValidatedOptions.default,
        answer: '',
        isAnswerValid: ValidatedOptions.default
      },
      {
        immutable: true,
        question: '',
        isQuestionValid: ValidatedOptions.default,
        answer: '',
        isAnswerValid: ValidatedOptions.default
      }
    ]
  };

  const [seedExamples, setSeedExamples] = useState<SeedExample[]>([
    emptySeedExample,
    emptySeedExample,
    emptySeedExample,
    emptySeedExample,
    emptySeedExample
  ]);

  useEffect(() => {
    const fetchUsername = async () => {
      if (session?.accessToken) {
        try {
          const fetchedUsername = await getGitHubUsername(session.accessToken);
          setGithubUsername(fetchedUsername);
        } catch (error) {
          console.error('Failed to fetch GitHub username:', error);
        }
      }
    };

    fetchUsername();
  }, [session?.accessToken]);

  const handleYamlUploadSuccess = (data: KnowledgeYamlData) => {
    setDomain(data.domain || '');
    setDocumentOutline(data.document_outline || '');

    // Set document repo, commit, and patterns if they exist in the uploaded data
    setKnowledgeDocumentRepositoryUrl(data.document.repo || '');
    setKnowledgeDocumentCommit(data.document.commit || '');
    setDocumentName(data.document.patterns.join(', ') || '');

    // Map data.seed_examples to seedExamples state variable
    const newSeedExamples = data.seed_examples.map((seedExample) => ({
      immutable: true,
      isExpanded: false,
      context: seedExample.context,
      isContextValid: validateContext(seedExample.context),
      questionAndAnswers: seedExample.questions_and_answers.map((qa) => ({
        immutable: true,
        question: qa.question,
        isQuestionValid: validateQuestion(qa.question),
        answer: qa.answer,
        isAnswerValid: validateAnswer(qa.answer)
      }))
    }));

    setSeedExamples(newSeedExamples);
    setDisableAction(!checkKnowledgeFormCompletion(knowledgeFormData));
  };

  const handleYamlUploadError = (title: string, message: string) => {
    setActionGroupAlertContent({
      title,
      message,
      success: false
    });
  };

  const validateContext = (context: string): ValidatedOptions => {
    if (context.length > 0 && context.length < 500) {
      setDisableAction(!checkKnowledgeFormCompletion(knowledgeFormData));
      return ValidatedOptions.success;
    }
    setDisableAction(true);
    return ValidatedOptions.error;
  };

  const validateQuestion = (question: string): ValidatedOptions => {
    if (question.length > 0 && question.length < 250) {
      setDisableAction(!checkKnowledgeFormCompletion(knowledgeFormData));
      return ValidatedOptions.success;
    }
    setDisableAction(true);
    return ValidatedOptions.error;
  };

  const validateAnswer = (answer: string): ValidatedOptions => {
    if (answer.length > 0 && answer.length < 250) {
      setDisableAction(!checkKnowledgeFormCompletion(knowledgeFormData));
      return ValidatedOptions.success;
    }
    setDisableAction(true);
    return ValidatedOptions.error;
  };

  const handleContextInputChange = (seedExampleIndex: number, contextValue: string): void => {
    setSeedExamples(
      seedExamples.map((seedExample: SeedExample, index: number) =>
        index === seedExampleIndex
          ? {
              ...seedExample,
              context: contextValue
            }
          : seedExample
      )
    );
  };

  const handleContextBlur = (seedExampleIndex: number): void => {
    setSeedExamples(
      seedExamples.map((seedExample: SeedExample, index: number) =>
        index === seedExampleIndex
          ? {
              ...seedExample,
              isContextValid: validateContext(seedExample.context)
            }
          : seedExample
      )
    );
  };

  const handleQuestionInputChange = (seedExampleIndex: number, questionAndAnswerIndex: number, questionValue: string): void => {
    setSeedExamples(
      seedExamples.map((seedExample: SeedExample, index: number) =>
        index === seedExampleIndex
          ? {
              ...seedExample,
              questionAndAnswers: seedExample.questionAndAnswers.map((questionAndAnswerPair: QuestionAndAnswerPair, index: number) =>
                index === questionAndAnswerIndex
                  ? {
                      ...questionAndAnswerPair,
                      question: questionValue
                    }
                  : questionAndAnswerPair
              )
            }
          : seedExample
      )
    );
  };

  const handleQuestionBlur = (seedExampleIndex: number, questionAndAnswerIndex: number): void => {
    setSeedExamples(
      seedExamples.map((seedExample: SeedExample, index: number) =>
        index === seedExampleIndex
          ? {
              ...seedExample,
              questionAndAnswers: seedExample.questionAndAnswers.map((questionAndAnswerPair: QuestionAndAnswerPair, index: number) =>
                index === questionAndAnswerIndex
                  ? {
                      ...questionAndAnswerPair,
                      isQuestionValid: validateQuestion(questionAndAnswerPair.question)
                    }
                  : questionAndAnswerPair
              )
            }
          : seedExample
      )
    );
  };

  const handleAnswerInputChange = (seedExampleIndex: number, questionAndAnswerIndex: number, answerValue: string): void => {
    setSeedExamples(
      seedExamples.map((seedExample: SeedExample, index: number) =>
        index === seedExampleIndex
          ? {
              ...seedExample,
              questionAndAnswers: seedExample.questionAndAnswers.map((questionAndAnswerPair: QuestionAndAnswerPair, index: number) =>
                index === questionAndAnswerIndex
                  ? {
                      ...questionAndAnswerPair,
                      answer: answerValue
                    }
                  : questionAndAnswerPair
              )
            }
          : seedExample
      )
    );
  };

  const handleAnswerBlur = (seedExampleIndex: number, questionAndAnswerIndex: number): void => {
    setSeedExamples(
      seedExamples.map((seedExample: SeedExample, index: number) =>
        index === seedExampleIndex
          ? {
              ...seedExample,
              questionAndAnswers: seedExample.questionAndAnswers.map((questionAndAnswerPair: QuestionAndAnswerPair, index: number) =>
                index === questionAndAnswerIndex
                  ? {
                      ...questionAndAnswerPair,
                      isAnswerValid: validateAnswer(questionAndAnswerPair.answer)
                    }
                  : questionAndAnswerPair
              )
            }
          : seedExample
      )
    );
  };

  const addQuestionAnswerPair = (seedExampleIndex: number): void => {
    const newQuestionAnswerPair: QuestionAndAnswerPair = {
      immutable: false,
      question: '',
      isQuestionValid: ValidatedOptions.default,
      answer: '',
      isAnswerValid: ValidatedOptions.default
    };
    setSeedExamples(
      seedExamples.map((seedExample: SeedExample, index: number) =>
        index === seedExampleIndex
          ? {
              ...seedExample,
              questionAndAnswers: [...seedExample.questionAndAnswers, newQuestionAnswerPair]
            }
          : seedExample
      )
    );
    setDisableAction(true);
  };

  const deleteQuestionAnswerPair = (seedExampleIndex: number, questionAnswerIndex: number): void => {
    setSeedExamples(
      seedExamples.map((seedExample: SeedExample, index: number) =>
        index === seedExampleIndex
          ? {
              ...seedExample,
              questionAndAnswers: seedExample.questionAndAnswers.filter((_, i) => i !== questionAnswerIndex)
            }
          : seedExample
      )
    );
    setDisableAction(!checkKnowledgeFormCompletion(knowledgeFormData));
  };

  const addSeedExample = (): void => {
    const seedExample = emptySeedExample;
    seedExample.immutable = false;
    seedExample.isExpanded = true;
    setSeedExamples([...seedExamples, seedExample]);
    setDisableAction(true);
  };

  const deleteSeedExample = (seedExampleIndex: number): void => {
    setSeedExamples(seedExamples.filter((_, index: number) => index !== seedExampleIndex));
    setDisableAction(!checkKnowledgeFormCompletion(knowledgeFormData));
  };

  const onCloseActionGroupAlert = () => {
    setActionGroupAlertContent(undefined);
  };

  const resetForm = (): void => {
    setEmail('');
    setName('');
    setDocumentOutline('');
    setSubmissionSummary('');
    setDomain('');
    setKnowledgeDocumentRepositoryUrl('');
    setKnowledgeDocumentCommit('');
    setDocumentName('');
    setTitleWork('');
    setLinkWork('');
    setLicenseWork('');
    setCreators('');
    setRevision('');
    setFilePath('');
    setSeedExamples([emptySeedExample, emptySeedExample, emptySeedExample, emptySeedExample, emptySeedExample]);
    setDisableAction(true);

    // setReset is just reset button, value has no impact.
    setReset(reset ? false : true);
  };

  const knowledgeFormData: KnowledgeFormData = {
    email: email,
    name: name,
    submissionSummary: submissionSummary,
    domain: domain,
    documentOutline: documentOutline,
    filePath: filePath,
    seedExamples: seedExamples,
    knowledgeDocumentRepositoryUrl: knowledgeDocumentRepositoryUrl,
    knowledgeDocumentCommit: knowledgeDocumentCommit,
    documentName: documentName,
    titleWork: titleWork,
    linkWork: linkWork,
    revision: revision,
    licenseWork: licenseWork,
    creators: creators
  };

  useEffect(() => {
    setDisableAction(!checkKnowledgeFormCompletion(knowledgeFormData));
  }, [knowledgeFormData]);

  return (
    <PageGroup>
      <PageBreadcrumb>
        <Breadcrumb>
          <BreadcrumbItem to="/"> Home </BreadcrumbItem>
          <BreadcrumbItem isActive>Knowledge Contribution</BreadcrumbItem>
        </Breadcrumb>
      </PageBreadcrumb>

      <PageSection style={{ backgroundColor: 'white' }}>
        <Title headingLevel="h1" size="2xl" style={{ paddingTop: '10' }}>
          Knowledge Contribution
        </Title>
        <TextContent>
          <KnowledgeDescriptionContent />
        </TextContent>
        <Form className="form-k">
          <KnowledgeYamlFileUpload onUploadSuccess={handleYamlUploadSuccess} onUploadError={handleYamlUploadError} />
          <AuthorInformation
            reset={reset}
            knowledgeFormData={knowledgeFormData}
            setDisableAction={setDisableAction}
            email={email}
            setEmail={setEmail}
            name={name}
            setName={setName}
          />

          <KnowledgeInformation
            reset={reset}
            knowledgeFormData={knowledgeFormData}
            setDisableAction={setDisableAction}
            submissionSummary={submissionSummary}
            setSubmissionSummary={setSubmissionSummary}
            domain={domain}
            setDomain={setDomain}
            documentOutline={documentOutline}
            setDocumentOutline={setDocumentOutline}
          />

          <FilePathInformation reset={reset} setFilePath={setFilePath} />

          <KnowledgeSeedExample
            seedExamples={seedExamples}
            handleContextInputChange={handleContextInputChange}
            handleContextBlur={handleContextBlur}
            handleQuestionInputChange={handleQuestionInputChange}
            handleQuestionBlur={handleQuestionBlur}
            handleAnswerInputChange={handleAnswerInputChange}
            handleAnswerBlur={handleAnswerBlur}
            deleteQuestionAnswerPair={deleteQuestionAnswerPair}
            addQuestionAnswerPair={addQuestionAnswerPair}
            addSeedExample={addSeedExample}
            deleteSeedExample={deleteSeedExample}
          />

          <DocumentInformation
            reset={reset}
            knowledgeFormData={knowledgeFormData}
            setDisableAction={setDisableAction}
            knowledgeDocumentRepositoryUrl={knowledgeDocumentRepositoryUrl}
            setKnowledgeDocumentRepositoryUrl={setKnowledgeDocumentRepositoryUrl}
            knowledgeDocumentCommit={knowledgeDocumentCommit}
            setKnowledgeDocumentCommit={setKnowledgeDocumentCommit}
            documentName={documentName}
            setDocumentName={setDocumentName}
          />

          <AttributionInformation
            reset={reset}
            knowledgeFormData={knowledgeFormData}
            setDisableAction={setDisableAction}
            titleWork={titleWork}
            setTitleWork={setTitleWork}
            linkWork={linkWork}
            setLinkWork={setLinkWork}
            revision={revision}
            setRevision={setRevision}
            licenseWork={licenseWork}
            setLicenseWork={setLicenseWork}
            creators={creators}
            setCreators={setCreators}
          />

          {actionGroupAlertContent && (
            <Alert
              variant={actionGroupAlertContent.success ? 'success' : 'danger'}
              title={actionGroupAlertContent.title}
              timeout={10000}
              onTimeout={onCloseActionGroupAlert}
              actionClose={<AlertActionCloseButton onClose={onCloseActionGroupAlert} />}
            >
              <p>
                {actionGroupAlertContent.message}
                <br />
                {actionGroupAlertContent.success && actionGroupAlertContent.url && actionGroupAlertContent.url.trim().length > 0 && (
                  <a href={actionGroupAlertContent.url} target="_blank" rel="noreferrer">
                    View your pull request
                  </a>
                )}
              </p>
            </Alert>
          )}

          <ActionGroup>
            <Submit
              disableAction={disableAction}
              knowledgeFormData={knowledgeFormData}
              setActionGroupAlertContent={setActionGroupAlertContent}
              githubUsername={githubUsername}
              resetForm={resetForm}
            />
            <DownloadDropdown
              disableAction={disableAction}
              knowledgeFormData={knowledgeFormData}
              setActionGroupAlertContent={setActionGroupAlertContent}
              githubUsername={githubUsername}
            />
            <ViewDropdown disableAction={disableAction} knowledgeFormData={knowledgeFormData} githubUsername={githubUsername} />
          </ActionGroup>
        </Form>
      </PageSection>
    </PageGroup>
  );
};

export default KnowledgeForm;
