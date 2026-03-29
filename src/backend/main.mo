import Storage "blob-storage/Storage";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Blob storage
  include MixinStorage();

  // Types
  public type UserProfile = {
    name : Text;
  };

  type ScoreBreakdown = {
    entrance : Nat;
    kitchen : Nat;
    bedrooms : Nat;
    toilets : Nat;
    energyBalance : Nat;
  };

  type RoomLabel = {
    room : Text;
    direction : Text;
    x : Int;
    y : Int;
  };

  type AnalysisStatus = {
    #pending;
    #complete;
  };

  type AnalysisRecord = {
    id : Text;
    userId : Principal;
    floorPlanName : Text;
    uploadedAt : Int;
    vastuScore : Nat;
    scoreBreakdown : ScoreBreakdown;
    issues : [Text];
    easyFixes : [Text];
    structuralChanges : [Text];
    floorPlanImage : ?Storage.ExternalBlob;
    roomLabels : [RoomLabel];
    status : AnalysisStatus;
  };

  // AnalysisRecord helper module
  module AnalysisRecord {
    public func compare(a1 : AnalysisRecord, a2 : AnalysisRecord) : Order.Order {
      Text.compare(a1.id, a2.id);
    };
  };

  // Store user profiles
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Store analyses
  let analyses = Map.empty<Text, AnalysisRecord>();

  // User profile functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Create new analysis
  public shared ({ caller }) func createAnalysis(floorPlanName : Text, floorPlanImage : ?Storage.ExternalBlob) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create analyses");
    };

    let id = floorPlanName.concat(Time.now().toText());
    let newAnalysis : AnalysisRecord = {
      id;
      userId = caller;
      floorPlanName;
      uploadedAt = Time.now();
      vastuScore = 0;
      scoreBreakdown = {
        entrance = 0;
        kitchen = 0;
        bedrooms = 0;
        toilets = 0;
        energyBalance = 0;
      };
      issues = [];
      easyFixes = [];
      structuralChanges = [];
      floorPlanImage;
      roomLabels = [];
      status = #pending;
    };

    analyses.add(id, newAnalysis);
    id;
  };

  // Get all analyses for current user
  public query ({ caller }) func getUserAnalyses() : async [AnalysisRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view analyses");
    };
    analyses.values().toArray().filter(func(a) { a.userId == caller });
  };

  // Get single analysis by id
  public query ({ caller }) func getAnalysis(id : Text) : async AnalysisRecord {
    switch (analyses.get(id)) {
      case (?analysis) {
        if (caller != analysis.userId and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own analyses");
        };
        analysis;
      };
      case (null) { Runtime.trap("Analysis not found") };
    };
  };

  // Update analysis
  public shared ({ caller }) func updateAnalysis(id : Text, updatedAnalysis : AnalysisRecord) : async () {
    switch (analyses.get(id)) {
      case (?existingAnalysis) {
        if (caller != existingAnalysis.userId and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update your own analyses");
        };
        analyses.add(id, updatedAnalysis);
      };
      case (null) { Runtime.trap("Analysis not found") };
    };
  };

  // Delete analysis
  public shared ({ caller }) func deleteAnalysis(id : Text) : async () {
    switch (analyses.get(id)) {
      case (?analysis) {
        if (caller != analysis.userId and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only owner or admin can delete. " # caller.toText());
        };
        analyses.remove(id);
      };
      case (null) { Runtime.trap("Analysis not found") };
    };
  };

  // Admin function to get all analyses
  public query ({ caller }) func getAllAnalyses() : async [AnalysisRecord] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all analyses");
    };
    analyses.values().toArray().sort();
  };
};
