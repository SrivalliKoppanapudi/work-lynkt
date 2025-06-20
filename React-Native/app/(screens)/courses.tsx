import React, { useState } from "react";
import { FlatList, View, Button, Alert } from "react-native";
import { supabase } from "../../lib/Superbase";
import CourseHeader from "../../component/courses/CourseHeader";
import CourseTitleInput from "../../component/courses/CourseTitleInput";
import CourseDescription from "../../component/courses/CourseDescription";
import CategorySelector from "../../component/courses/CategorySelector";
import PrerequisiteInput from "../../component/courses/PrerequisiteInput";
import LearningObjectives from "../../component/courses/LearningObjective";
import ModuleSection from "../../component/courses/ModuleSection"
import ResourceSection from "../../component/courses/ResourceSection";
import PreviewModal from "../../component/courses/PreviewModal";
import { uploadResource } from "../../utils/resourceUtils";

import CourseImageUpload from "../../component/courses/CourseImageUpload";
import {
  Course,
  Module as CourseModule,
  Resource as ResourceType,
  Assessment,
} from "../../types/courses";
import AssessmentSection from "../../component/Assessments/AssessmentSection";
import AssessmentModal from "../../component/Assessments/AssessmentModal";

const categories = [
  'Lesson Planning & Curriculum',
  'Classroom Management',
  'Student Engagement',
  'Assessment & Grading',
  'Educational Technology',
  'Professional Development',
  'Special Education & Inclusion',
  'Communication & Collaboration',
  'Subject-Specific Resources',
  'Other'
];

interface AllProps {
  courseHeaderProps: {
    error: string | null;
    successMessage: string | null;
    loading: boolean;
    onPreview: () => void;
    onSaveDraft: () => void;
    onPublish: () => void;
  };
  courseTitleProps: {
    title: string;
    setTitle: (title: string) => void;
  };
  courseDescriptionProps: {
    description: string;
    setDescription: (description: string) => void;
  };
  categoryProps: {
    selectedCategories: string[];
    setSelectedCategories: (categories: string[]) => void;
    categories: string[];
  };
  prerequisiteProps: {
    prerequisites: string;
    setPrerequisites: (prerequisites: string) => void;
  };
  objectivesProps: {
    objectives: string[];
    setobjectives: (objectives: string[]) => void;
    newObjective: string;
    setNewObjective: (newObjective: string) => void;
    handleAddObjective: () => void;
  };
  moduleProps: {
    modules: CourseModule[];
    setModules: (modules: CourseModule[]) => void;
    handleAddModule: () => void;
  };
  resourceProps: {
    resources: ResourceType[];
    setResources: (resources: ResourceType[]) => void;
    handleUploadResource: () => Promise<void>;
  };
  assessmentProps: {
    assessments: Assessment[];
    onAddAssessment: () => void;
    onEditAssessment: (assessment: Assessment) => void;
  };
  imageUploadProps: {
    image: string;
    setImage: (image: string) => void;
    setError: (error: string | null) => void;
  };
}

// Utility function to strip HTML tags
const stripHtmlTags = (str: string) => {
  return str.replace(/<[^>]*>?/gm, '');
};

export default function CourseScreen() {
  const [course, setCourse] = useState<Course>({
    id: '',
    title: '',
    description: '',
    categories: [],
    prerequisites: '',
    objectives: [],
    modules: [],
    enrollmentcount: 0,
    completionRate: 0,
    image: '',
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [newObjective, setNewObjective] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [resources, setResources] = useState<ResourceType[]>([]);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const handleAddObjective = () => {
    if (newObjective.trim()) {
      setCourse(prevCourse => ({
        ...prevCourse,
        objectives: [...prevCourse.objectives, newObjective.trim()]
      }));
      setNewObjective("");
    }
  };

  const handleAddModule = () => {
    // Use UUID-style ID to ensure uniqueness
    const newModuleId = `module_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    const newModule: CourseModule = {
      id: newModuleId,
      title: `Module ${modules.length + 1}`,
      description: "",
      lessons: [], // Always initialize with empty array
      order: modules.length
    };
    
    // Update modules with a callback to ensure it's based on latest state
    setModules(prevModules => {
      const updatedModules = [...prevModules, newModule];
      
      // Log for debugging
      console.log(`Added new module with ID: ${newModuleId}, total modules: ${updatedModules.length}`);
      
      return updatedModules;
    });
    
    // Prevent immediate re-render to avoid layout jumps
    setTimeout(() => {}, 10);
  };

  const handleUploadResource = async () => {
    try {
      // Prevent interactions during resource selection
      setLoading(true);
      
      // Use the new utility function for uploading resources
      // Generate a temporary course ID if we don't have one yet
      const tempCourseId = `temp_course_${Date.now()}`;
      const tempModuleId = 'course_level';
      
      // Call the utility function to handle file selection and upload
      const newResource = await uploadResource(tempCourseId, tempModuleId);
      
      if (!newResource) {
        // User cancelled or upload failed
        setLoading(false);
        return;
      }
      
      console.log('Resource uploaded successfully:', newResource);
      
      // Add the new resource to our state
      setResources(prevResources => {
        const updatedResources = [...prevResources, newResource];
        console.log(`Added resource: ${newResource.id}, total resources: ${updatedResources.length}`);
        return updatedResources;
      });
      
      setSuccessMessage('Resource uploaded successfully');
      
      // Clear message after 2 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 2000);
      
    } catch (error) {
      console.error("Error uploading resource:", error);
      setError(typeof error === 'object' ? error.message || "Failed to upload resource" : "Failed to upload resource");
      
      // Clear error after 3 seconds
      setTimeout(() => {
        setError(null);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };



  const preparePreviewData = () => {
    const data = [
      { type: "title", content: course.title || "Untitled Course" },
      { type: "description", content: stripHtmlTags(course.description) || "No description provided" },
      { type: "categories", content: course.categories.length > 0 ? course.categories : ["Uncategorized"] },
      { type: "prerequisites", content: course.prerequisites || "None" },
      { type: "objectives", content: course.objectives.length > 0 ? course.objectives : [] },
      { type: "modules", content: modules.length > 0 ? modules : [] },
      { type: "resources", content: resources.length > 0 ? resources : [] },
      { type: "assessments", content: assessments.length > 0 ? assessments : [] },
    ];
    setPreviewData(data);
    console.log("Preview data prepared:", data);
  };


  const validateCourseForPublish = () => {
    let isValid = true;
    let errorMessage = '';

    if (!course.title.trim()) {
      errorMessage = 'Title is required';
      isValid = false;
    } else if (!course.description.trim() || stripHtmlTags(course.description) === '') {
      errorMessage = 'Description is required';
      isValid = false;
    } else if (course.categories.length === 0) {
      errorMessage = 'At least one category is required';
      isValid = false;
    } else if (!course.prerequisites.trim()) {
      errorMessage = 'Prerequisites are required';
      isValid = false;
    } else if (course.objectives.length === 0) {
      errorMessage = 'At least one learning objective is required';
      isValid = false;
    } else if (modules.length === 0) {
      errorMessage = 'At least one module is required';
      isValid = false;
    }

    if (!isValid) {
      setError(errorMessage);
    }
    return isValid;
  };

  const handleSave = async (publish: boolean = false) => {
    try {
      setError(null);
      setSuccessMessage(null);
      setLoading(true);

      if (publish) {
        const isValid = validateCourseForPublish();
        if (!isValid) {
          setLoading(false);
          return;
        }
      }

      if (!course.title.trim()) {
        setError('Title is required');
        setLoading(false);
        return;
      }

      // Get current user to set as publisher
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        setError('Failed to authenticate user');
        setLoading(false);
        return;
      }

      // Log image information
      console.log("Image to save:", course.image);

      const courseData = {
        title: course.title,
        description: stripHtmlTags(course.description),
        categories: course.categories,
        prerequisites: course.prerequisites,
        objectives: course.objectives,
        modules: modules,
        resources: resources, // Ensure resources are stored at the course level
        assessments: assessments,
        image: course.image, // We're storing just the filename, not the full URL
        status: publish ? 'published' : 'draft',
        created_at: new Date().toISOString(),
        user_id: user?.id // Add publisher_id to identify course creator
      };

      console.log('Saving course data:', courseData);

      const { data, error: supabaseError } = await supabase
        .from('courses')
        .insert([courseData])
        .select();

      if (supabaseError) {
        throw supabaseError;
      }

      if (publish) {
        setSuccessMessage('Course published successfully!');
      } else {
        setSuccessMessage('Course saved as draft');
      }
      setLoading(false);
      
      console.log('Course saved successfully:', data);
    } catch (error) {
      console.error('Error saving course:', error);
      setError('Unexpected error occurred while saving the course: ' + (error.message || error));
      setLoading(false);
    }
  };

  const handleAddAssessment = () => {
    // Generate a stable unique ID
    const assessmentId = Date.now();
    
    const newAssessment: Assessment = {
      id: assessmentId,
      title: `Assessment ${assessments.length + 1}`,
      description: '',
      type: 'quiz',
      questions: [],
      totalPoints: 0
    };
    
    // First update the state to add the new assessment
    setAssessments(prevAssessments => {
      const updatedAssessments = [...prevAssessments, newAssessment];
      console.log(`Added assessment with ID: ${assessmentId}, total: ${updatedAssessments.length}`);
      return updatedAssessments;
    });
    
    // Then set the current assessment and show the modal
    setTimeout(() => {
      setCurrentAssessment(newAssessment);
      setShowAssessmentModal(true);
    }, 100);
  };

  const handleEditAssessment = (assessment: Assessment) => {
    // First update the state to ensure UI stability
    setCurrentAssessment(null);
    
    // Then set the current assessment and show the modal after a brief delay
    setTimeout(() => {
      setCurrentAssessment(assessment);
      setShowAssessmentModal(true);
    }, 50);
  };

  const allProps: AllProps = {
    courseHeaderProps: {
      error,
      successMessage,
      loading,
      onPreview: () => {
        preparePreviewData();
        setShowPreview(true);
      },
      onSaveDraft: () => handleSave(false),
      onPublish: () => handleSave(true),
    },
    courseTitleProps: {
      title: course.title,
      setTitle: (title) => setCourse({ ...course, title }),
    },
    courseDescriptionProps: {
      description: course.description,
      setDescription: (description) => setCourse({ ...course, description }),
    },
    categoryProps: {
      selectedCategories: course.categories,
      setSelectedCategories: (categories) => setCourse({ ...course, categories }),
      categories,
    },
    prerequisiteProps: {
      prerequisites: course.prerequisites,
      setPrerequisites: (prerequisites) => setCourse({ ...course, prerequisites }),
    },
    objectivesProps: {
      objectives: course.objectives,
      setobjectives: (objectives) => setCourse({ ...course, objectives }),
      newObjective,
      setNewObjective,
      handleAddObjective,
    },
    moduleProps: {
      modules,
      setModules,
      handleAddModule,
    },
    resourceProps: {
      resources,
      setResources,
      handleUploadResource,
    },
    assessmentProps: {
      assessments,
      onAddAssessment: handleAddAssessment,
      onEditAssessment: handleEditAssessment,
    },
    imageUploadProps: {
      image: course.image,
      setImage: (image) => setCourse({ ...course, image }),
      setError,
    },
  };

  const data = [
    { type: 'header', props: allProps.courseHeaderProps },
    { type: 'courseTitle', props: allProps.courseTitleProps },
    { type: 'courseImage', props: allProps.imageUploadProps },
    { type: 'courseDescription', props: allProps.courseDescriptionProps },
    { type: 'categories', props: allProps.categoryProps },
    { type: 'prerequisites', props: allProps.prerequisiteProps },
    { type: 'objectives', props: allProps.objectivesProps },
    { type: 'syllabus', props: allProps.moduleProps },
    { type: 'resources', props: allProps.resourceProps },
    { type: 'assessments', props: allProps.assessmentProps },
  ];

  const renderItem = ({ item }: { item: any }) => {
    switch (item.type) {
      case 'header':
        return <CourseHeader {...item.props} />;
      case 'courseTitle':
        return <CourseTitleInput {...item.props} />;
      case 'courseImage':
        return <CourseImageUpload {...item.props} />;
      case 'courseDescription':
        return <CourseDescription {...item.props} />;
      case 'categories':
        return <CategorySelector {...item.props} />;
      case 'prerequisites':
        return <PrerequisiteInput {...item.props} />;
      case 'objectives':
        return <LearningObjectives {...item.props} />;
      case 'syllabus':
        return <ModuleSection {...item.props} />;
      // case 'resources':
      //   return <ResourceSection {...item.props} />;
      case 'assessments':
        return <AssessmentSection {...item.props} />;
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.type}
        contentContainerStyle={{
          paddingVertical: 16,
          paddingBottom: 100,
        }}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        removeClippedSubviews={false}
        maxToRenderPerBatch={5}
        windowSize={5}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10
        }}
        updateCellsBatchingPeriod={100}
        onEndReachedThreshold={0.5}
        getItemLayout={(data, index) => ({
          length: 100, // Approximate height of each item
          offset: 100 * index,
          index,
        })}
        extraData={modules.length} // Re-render when modules change
      />
      <PreviewModal 
        showPreview={showPreview} 
        setShowPreview={setShowPreview} 
        previewData={previewData} 
      />
      {currentAssessment && (
        <AssessmentModal
          showAssessmentModal={showAssessmentModal}
          setShowAssessmentModal={setShowAssessmentModal}
          currentAssessment={currentAssessment}
          setCurrentAssessment={setCurrentAssessment}
          assessments={assessments}
          setAssessments={setAssessments}
        />
      )}
    </View>
  );
}